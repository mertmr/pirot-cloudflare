import { createHash } from 'node:crypto';
import { writeFileSync, chmodSync } from 'node:fs';
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Database } from 'bun:sqlite';
import { parse } from 'jsonc-parser';
import { ENTITY_TABLES, TABLES } from '../src/server/d1-schema';
import { object, list, text, integer, type JsonObject } from '../src/server/value';
import type { EntityKind } from '../src/server/entity-specs';
const [action, credentialsPath, folderArgument] = process.argv.slice(2);
if (!['capture', 'import', 'verify', 'retire'].includes(action) || !credentialsPath || !folderArgument)
  throw new Error(
    'Usage: bun scripts/migrate-d1-storage.ts capture|import|verify|retire /private/staging-credentials.json /private/backup-directory',
  );
const folder = resolve(folderArgument);
await mkdir(folder, { recursive: true, mode: 0o700 });
await chmod(folder, 0o700);
const config = object(parse(await readFile('wrangler.jsonc', 'utf8'))),
  staging = object(object(config.env).staging),
  vars = object(staging.vars),
  dbName = text(object(list(staging.d1_databases)[0]).database_name);
const credentials = object(JSON.parse(await readFile(credentialsPath, 'utf8'))),
  base = text(vars.PUBLIC_URL);
if (credentials.url !== base || !base.startsWith('https://pirot-cloudflare-staging.') || !base.endsWith('.workers.dev'))
  throw new Error('Only the configured isolated staging environment is supported');
async function save(name: string, value: string | Uint8Array) {
  const file = join(folder, name);
  await writeFile(file, value, { mode: 0o600 });
  await chmod(file, 0o600);
  return file;
}
function wrangler(args: string[], name: string) {
  const result = spawnSync('bunx', ['--no-install', 'wrangler', ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const output = result.stdout + '\n' + result.stderr;
  requireSave(name, output);
  if (result.status !== 0) throw new Error(`Wrangler failed; see private ${name}`);
  return result.stdout;
}
function requireSave(name: string, value: string) {
  writeFileSync(join(folder, name), value, { mode: 0o600 });
  chmodSync(join(folder, name), 0o600);
}
const quote = (value: unknown) =>
  value === null || value === undefined
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : "'" + String(value).replace(/'/g, "''") + "'";
interface Snapshot {
  tenantId: number;
  tables: Record<string, JsonObject[]>;
  files: { key: string; uploaded: string; size: number; metadata: JsonObject; filename: string }[];
}
const snapshotsFile = join(folder, 'frozen-business.json');
if (action === 'capture') {
  const login = await fetch(base + '/api/authenticate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: credentials.login, password: credentials.password }),
  });
  if (!login.ok) throw new Error(`Login failed ${login.status}`);
  const token = text(object(await login.json()).id_token);
  const call = async (path: string, body?: unknown) => {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response;
  };
  const tenants = list(await (await call('/api/tenants')).json()).map(v => integer(object(v).id, true));
  const frozen: number[] = [],
    snapshots: Snapshot[] = [];
  try {
    for (const tenantId of tenants) {
      await call('/api/admin/tenant-storage/freeze', { tenantId });
      frozen.push(tenantId);
    }
    for (const tenantId of tenants) {
      const snapshot: Snapshot = { tenantId, tables: {}, files: [] };
      for (const table of Object.keys(TABLES)) {
        const rows: JsonObject[] = [];
        let offset = 0;
        for (;;) {
          const page = object(await (await call('/api/admin/tenant-storage/page', { tenantId, table, offset })).json());
          rows.push(...list(page.rows).map(object));
          if (page.done) break;
          offset = integer(page.next);
        }
        snapshot.tables[table] = rows.filter(row => table !== 'tenant_meta' || row.key !== 'storage_frozen');
      }
      let cursor: string | undefined;
      for (;;) {
        const page = object(await (await call('/api/admin/legacy-files/list', { tenantId, cursor })).json());
        for (const raw of list(page.objects)) {
          const file = object(raw),
            key = text(file.key),
            filename = `report-${tenantId}-${key.split('/').at(-1)}`;
          const bytes = new Uint8Array(await (await call('/api/admin/legacy-files/get', { tenantId, key })).arrayBuffer());
          await save(filename, bytes);
          snapshot.files.push({ key, uploaded: text(file.uploaded), size: integer(file.size), metadata: object(file.metadata), filename });
        }
        if (page.done) break;
        cursor = text(page.cursor);
      }
      snapshots.push(snapshot);
    }
    await save('frozen-business.json', JSON.stringify(snapshots));
    console.log(`Captured ${snapshots.length} frozen cooperatives; all rows and report bytes are in the private backup directory.`);
  } catch (error) {
    for (const tenantId of frozen) await call('/api/admin/tenant-storage/unfreeze', { tenantId }).catch(() => {});
    throw error;
  }
}
if (action === 'import') {
  const snapshots = JSON.parse(await readFile(snapshotsFile, 'utf8')) as Snapshot[];
  const count = wrangler(
    [
      'd1',
      'execute',
      dbName,
      '--remote',
      '--env',
      'staging',
      '--command',
      'SELECT (SELECT count(*) FROM business_entities)+(SELECT count(*) FROM business_tenant_meta)+(SELECT count(*) FROM report_files) AS n',
      '--json',
    ],
    'destination-check.log',
  );
  if (JSON.parse(count)[0]?.results?.[0]?.n !== 0) throw new Error('Destination business storage is not empty; refuse overwrite');
  const statements: string[] = [];
  for (const snapshot of snapshots) {
    const tenant = snapshot.tenantId;
    statements.push(`INSERT INTO business_versions(tenant_id,version) VALUES(${tenant},0);`);
    for (const [table, rows] of Object.entries(snapshot.tables))
      for (const row of rows) {
        const spec = TABLES[table];
        const physical = table === 'entities' ? ENTITY_TABLES[text(row.kind) as EntityKind] : spec.physical;
        if (!physical) throw new Error('Unknown entity kind in backup');
        const columns = table === 'entities' ? ['id', 'data'] : spec.columns;
        statements.push(
          `INSERT INTO ${physical}(tenant_id,${columns.join(',')}) VALUES(${tenant},${columns.map(c => quote(row[c])).join(',')});`,
        );
      }
    for (const file of snapshot.files) {
      const bytes = new Uint8Array(await readFile(join(folder, file.filename)));
      if (bytes.byteLength !== file.size) throw new Error('Backup report byte count mismatch');
      statements.push(
        `INSERT INTO report_files(tenant_id,key,uploaded,size,metadata,content_type) VALUES(${tenant},${quote(file.key)},${quote(file.uploaded)},${file.size},${quote(JSON.stringify(file.metadata))},'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');`,
      );
      for (let offset = 0; offset < bytes.length; offset += 40000)
        statements.push(
          `INSERT INTO report_file_chunks(tenant_id,key,ordinal,data) VALUES(${tenant},${quote(file.key)},${offset / 40000},X'${Buffer.from(bytes.slice(offset, offset + 40000)).toString('hex')}');`,
        );
    }
  }
  const sql = await save('import-business.sql', statements.join('\n') + '\n');
  wrangler(['d1', 'execute', dbName, '--remote', '--env', 'staging', '--file', sql], 'import.log');
  console.log(`Imported ${snapshots.length} cooperatives into staging D1. Keep legacy storage frozen until verification passes.`);
}
if (action === 'verify') {
  const exportPath = join(folder, 'verified-d1.sql');
  wrangler(['d1', 'export', dbName, '--remote', '--env', 'staging', '--output', exportPath], 'export.log');
  await chmod(exportPath, 0o600);
  const db = new Database(':memory:');
  db.exec(await readFile(exportPath, 'utf8'));
  const snapshots = JSON.parse(await readFile(snapshotsFile, 'utf8')) as Snapshot[];
  const stable = (rows: unknown[]) =>
    rows
      .map(row => JSON.stringify(Object.fromEntries(Object.entries(row as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))))
      .sort();
  let total = 0,
    sales = 0,
    files = 0;
  for (const snapshot of snapshots) {
    for (const [table, expected] of Object.entries(snapshot.tables)) {
      const spec = TABLES[table];
      const actual = db
        .query(
          `SELECT ${spec.columns.join(',')} FROM ${spec.physical} WHERE tenant_id=?${table === 'tenant_meta' ? " AND key<>'migration_storage_proof'" : ''}`,
        )
        .all(snapshot.tenantId);
      if (JSON.stringify(stable(actual)) !== JSON.stringify(stable(expected)))
        throw new Error(`Exact D1 comparison failed: tenant ${snapshot.tenantId}, ${table}`);
      total += actual.length;
      if (table === 'entities') sales += expected.filter(r => r.kind === 'satis').length;
    }
    for (const file of snapshot.files) {
      const rows = db
        .query('SELECT data FROM report_file_chunks WHERE tenant_id=? AND key=? ORDER BY ordinal')
        .all(snapshot.tenantId, file.key) as { data: Uint8Array }[];
      const bytes = Buffer.concat(rows.map(r => Buffer.from(r.data)));
      if (!bytes.equals(await readFile(join(folder, file.filename)))) throw new Error('Report bytes changed during migration');
      files++;
    }
  }
  const proofStatements = snapshots.map(snapshot => {
    const hash = (rows: JsonObject[]) => createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    const proof = JSON.stringify({
      entities: hash(snapshot.tables.entities),
      history: hash(snapshot.tables.history),
      snapshot: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),
      verifiedAt: new Date().toISOString(),
    });
    return `INSERT INTO business_tenant_meta(tenant_id,key,value) VALUES(${snapshot.tenantId},'migration_storage_proof',${quote(proof)}) ON CONFLICT(tenant_id,key) DO UPDATE SET value=excluded.value;`;
  });
  wrangler(
    ['d1', 'execute', dbName, '--remote', '--env', 'staging', '--file', await save('verification-proof.sql', proofStatements.join('\n'))],
    'verification-proof.log',
  );
  db.close();
  await save(
    'verification.json',
    JSON.stringify({ verifiedAt: new Date().toISOString(), cooperatives: snapshots.length, rows: total, sales, files, exact: true }),
  );
  console.log(
    `Verified every persisted row and report byte: ${snapshots.length} cooperatives, ${total} rows, ${sales} sales, ${files} files. D1 SQL export restored successfully in independent SQLite.`,
  );
}

if (action === 'retire') {
  const snapshots = JSON.parse(await readFile(snapshotsFile, 'utf8')) as Snapshot[];
  const login = await fetch(base + '/api/authenticate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: credentials.login, password: credentials.password }),
  });
  if (!login.ok) throw new Error('Login failed');
  const token = text(object(await login.json()).id_token);
  for (const snapshot of snapshots) {
    const response = await fetch(base + '/api/admin/tenant-storage/retire', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
      body: JSON.stringify({ tenantId: snapshot.tenantId }),
    });
    if (!response.ok) throw new Error(`Legacy retirement refused for tenant ${snapshot.tenantId}: HTTP ${response.status}`);
  }
  await save('retirement.json', JSON.stringify({ retiredAt: new Date().toISOString(), tenants: snapshots.map(s => s.tenantId) }));
  console.log(`Cleared ${snapshots.length} verified legacy tenant storage objects. D1 is the sole persisted business store.`);
}
