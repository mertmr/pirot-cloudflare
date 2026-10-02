import { readFile, writeFile } from 'node:fs/promises';
import { object, list, integer, type JsonObject, type JsonValue } from '../src/server/value';
import { canonical } from '../src/server/migration';
const [filename, base, mode = 'import'] = process.argv.slice(2);
if (!filename || !base || !['import', 'verify', 'abort'].includes(mode))
  throw new Error(
    'Usage: PIROT_MIGRATION_TOKEN=… bun scripts/import-tenant.ts /secure/tenant-N.json https://staging.example [import|verify|abort]',
  );
const url = new URL(base);
if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
  throw new Error('Migration requires HTTPS except localhost');
const token = process.env.PIROT_MIGRATION_TOKEN;
if (!token) throw new Error('Set PIROT_MIGRATION_TOKEN to an administrator JWT');
const bundle = object(JSON.parse(await readFile(filename, 'utf8'))),
  tenantId = integer(bundle.tenantId, true),
  session = String(bundle.session);
async function call(action: string, body: JsonObject, key: string): Promise<JsonObject> {
  const response = await fetch(new URL(`/api/admin/tenant-${action}`, url), {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'idempotency-key': `${session}:${key}` },
    body: JSON.stringify({ tenantId, session, ...body }),
  });
  if (!response.ok) {
    let code = 'unknown';
    try {
      code = String(object(await response.json()).errorKey);
    } catch {
      // A proxy error may not have a JSON body. Preserve the HTTP status.
    }
    throw new Error(`Migration ${action} failed: HTTP ${response.status}, ${code}`);
  }
  return object(await response.json());
}
if (mode === 'abort') {
  await call('import/abort', {}, 'abort');
  console.log(`Aborted unpublished tenant ${tenantId} import.`);
} else {
  if (mode === 'import') {
    await call(
      'import/begin',
      { schemaVersion: bundle.schemaVersion, expected: bundle.expected, settings: bundle.settings ?? null },
      'begin',
    );
    const sendBatches = async (action: string, rows: JsonValue[], kind?: string) => {
      let batch: JsonValue[] = [],
        bytes = 0,
        index = 0;
      const send = async () => {
        if (!batch.length) return;
        await call(`import/${action}`, { rows: batch, ...(kind ? { kind } : {}) }, `${action}:${kind ?? 'history'}:${index++}`);
        batch = [];
        bytes = 0;
      };
      for (const row of rows) {
        const size = new TextEncoder().encode(JSON.stringify(row)).byteLength;
        if (size > 1_000_000) throw new Error('Single migration record exceeds batch limit');
        if (batch.length >= 200 || bytes + size > 1_000_000) await send();
        batch.push(row);
        bytes += size;
      }
      await send();
    };
    for (const [kind, values] of Object.entries(object(bundle.entities))) await sendBatches('batch', list(values), kind);
    await sendBatches('history', list(bundle.history));
    await call('import/finish', {}, 'finish');
  }
  const actual = await call('reconciliation', {}, 'verify');
  if (canonical(actual) !== canonical(bundle.expected)) throw new Error('Reconciliation mismatch; keep cutover disabled');
  await writeFile(
    `${filename}.verified.json`,
    JSON.stringify({ tenantId, verifiedAt: new Date().toISOString(), reconciliation: actual }, null, 2),
    { mode: 0o600 },
  );
  console.log(`Tenant ${tenantId}: every entity checksum and financial balance reconciled.`);
}
