import { open, rename, rm, stat } from 'node:fs/promises';
import { object, list, text, integer, type JsonObject, type Entity } from '../src/server/value';
import { ENTITY_SPECS, type EntityKind } from '../src/server/entity-specs';
import { manifest } from './prepare-migration';
import { canonical } from '../src/server/migration';
const [base, tenant, filename] = process.argv.slice(2);
if (!base || !tenant || !filename)
  throw new Error('Usage: PIROT_MIGRATION_TOKEN=… bun scripts/backup-tenant.ts https://staging.example 1 /secure/tenant-1.json');
const url = new URL(base),
  tenantId = integer(tenant, true),
  token = process.env.PIROT_MIGRATION_TOKEN;
if (!token) throw new Error('Set PIROT_MIGRATION_TOKEN to an administrator JWT');
if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
  throw new Error('Backup requires HTTPS except localhost');
try {
  await stat(filename);
  throw new Error('Destination already exists; choose a new backup filename');
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}
async function call(action: string, input: JsonObject = {}) {
  const response = await fetch(new URL(`/api/admin/tenant-backup/${action}`, url), {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
    body: JSON.stringify({ tenantId, ...input }),
  });
  if (!response.ok) throw new Error(`Backup ${action} failed: HTTP ${response.status}`);
  return object(await response.json());
}
const run = await call('begin'),
  id = text(run.id),
  metadata = object(run.metadata),
  entities = Object.fromEntries(Object.keys(ENTITY_SPECS).map(k => [k, [] as Entity[]])) as Parameters<typeof manifest>[1],
  history: JsonObject[] = [];
try {
  for (const value of list(run.sections)) {
    const section = text(value);
    let after = 0;
    for (;;) {
      const page = await call('page', { id, section, after });
      const rows = list(page.rows).map(object);
      if (section === 'history') history.push(...rows);
      else entities[section.slice(7) as EntityKind].push(...(rows as Parameters<typeof manifest>[1][EntityKind]));
      if (page.done) break;
      const next = integer(page.next);
      if (next <= after) throw new Error('Backup cursor did not advance');
      after = next;
    }
  }
  if (canonical(manifest(tenantId, entities, history.length, history)) !== canonical(metadata.expected))
    throw new Error('Backup checksum mismatch');
  const temporary = `${filename}.partial-${crypto.randomUUID()}`;
  const file = await open(temporary, 'wx', 0o600);
  try {
    await file.writeFile(JSON.stringify({ ...metadata, entities, history }));
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await rename(temporary, filename);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  console.log(`Tenant ${tenantId}: consistent business backup saved and checksums verified.`);
} finally {
  await call('release', { id });
}
