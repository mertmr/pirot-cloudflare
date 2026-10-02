import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { parse } from 'jsonc-parser';
import { object, list, integer, text, type JsonObject } from '../src/server/value';
const [credentialsFile, outputDirectory] = process.argv.slice(2);
if (!credentialsFile || !outputDirectory)
  throw new Error('Usage: bun run smoke:staging /private/staging-admin.json /private/proof-directory');
const config = object(parse(await readFile('wrangler.jsonc', 'utf8'))),
  staging = object(object(config.env).staging),
  vars = object(staging.vars),
  credentials = object(JSON.parse(await readFile(credentialsFile, 'utf8'))),
  base = new URL(text(vars.PUBLIC_URL));
if (
  base.protocol !== 'https:' ||
  !base.hostname.startsWith(`${text(staging.name)}.`) ||
  !base.hostname.endsWith('.workers.dev') ||
  credentials.url !== base.origin
)
  throw new Error('Smoke verification accepts only the configured isolated staging Worker and matching credentials');
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
async function response(
  path: string,
  method = 'GET',
  body?: unknown,
  token = '',
  key: string = crypto.randomUUID(),
  extra: Record<string, string> = {},
) {
  return fetch(new URL(path, base), {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      'idempotency-key': key,
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
}
async function call(path: string, method = 'GET', body?: unknown, token = '', key?: string): Promise<JsonObject> {
  const r = await response(path, method, body, token, key);
  assert(r.ok, `${method} ${path}: HTTP ${r.status}`);
  return r.status === 204 ? {} : object(await r.json());
}
async function array(path: string, token: string) {
  const r = await response(path, 'GET', undefined, token);
  assert(r.ok, `${path}: HTTP ${r.status}`);
  return list(await r.json()).map(object);
}
assert((await response('/management/health')).ok, 'Worker/D1 health failed');
assert((await response('/')).ok, 'TanStack document failed');
assert((await response('/api/uruns')).status === 401, 'Anonymous financial access allowed');
assert((await response('/api/internal/bootstrap', 'POST', {})).status === 404, 'Remote bootstrap exposed');
const administrator = text(
  (await call('/api/authenticate', 'POST', { username: credentials.login, password: credentials.password })).id_token,
);
const adminAccount = await call('/api/account', 'GET', undefined, administrator);
assert(list(adminAccount.authorities).includes('ROLE_ADMIN'), 'Staging credentials lack administrator authority');
const nonce = crypto.randomUUID().slice(0, 8),
  tenant = await call('/api/tenants', 'POST', { tenantName: `Synthetic deployment smoke ${nonce}` }, administrator),
  tid = integer(tenant.id, true),
  username = `smoke-${nonce}`,
  password = crypto.randomUUID() + '-synthetic';
await call(
  '/api/admin/users',
  'POST',
  { login: username, email: `${username}@example.invalid`, password, tenantId: tid, activated: true, authorities: ['ROLE_USER'] },
  administrator,
);
const token = text((await call('/api/authenticate', 'POST', { username, password })).id_token);
const account = await call('/api/account', 'GET', undefined, token);
assert(
  (
    await response('/api/cooperative-operations', 'GET', undefined, token, undefined, {
      'x-pirot-principal': JSON.stringify({ authorities: ['ROLE_ADMIN'], tenantId: 1 }),
    })
  ).status === 403,
  'Forged principal header elevated authority',
);
assert((await response('/api/_internal/outbox', 'GET', undefined, token)).status === 404, 'Private tenant endpoint exposed');
await call('/api/kasa-hareketleris', 'POST', { kasaMiktar: '100.00', hareket: 'Synthetic deployment opening balance' }, token);
const product = await call(
  '/api/uruns',
  'POST',
  {
    urunAdi: `Synthetic smoke product ${nonce}`,
    birim: 'ADET',
    stok: '10',
    musteriFiyati: '10.00',
    stokSiniri: '0',
    active: true,
    satista: true,
  },
  token,
);
const pid = integer(product.id, true);
const cash = async () => (await array('/api/kasa-hareketleris?sort=id,desc', token))[0].kasaMiktar;
const stock = async () => (await call(`/api/uruns/${pid}`, 'GET', undefined, token)).stok;
const intent = { tenantId: 1, user: { id: 1 }, toplamTutar: '999.00', odendi: false, stokHareketleriLists: [{ urunId: pid, miktar: 2 }] };
const retryKey = crypto.randomUUID();
const sale = await call('/api/satis', 'POST', intent, token, retryKey);
assert(
  sale.toplamTutar === '20.00' && sale.tenantId === tid && object(sale.user).id === account.id,
  'Sale trusted browser totals/ownership',
);
assert((await call('/api/satis', 'POST', intent, token, retryKey)).id === sale.id, 'Retry duplicated the sale');
assert((await cash()) === '120.00' && (await stock()) === '8', 'Cash/stock create or retry effects incorrect');
assert(
  (await response('/api/satis', 'POST', { stokHareketleriLists: [{ urunId: pid, miktar: 100 }] }, token)).status === 409,
  'Overselling was accepted',
);
assert((await cash()) === '120.00' && (await stock()) === '8', 'Rejected operation changed ledgers');
const other = await response(`/api/satis/${sale.id}`, 'GET', undefined, administrator);
assert(other.status === 404 || (other.ok && object(await other.json()).tenantId === adminAccount.tenantId), 'Cross-tenant sale leaked');
const edited = await call(
  `/api/satis/${sale.id}`,
  'PUT',
  { ...intent, id: sale.id, stokHareketleriLists: [{ urunId: pid, miktar: 3 }] },
  token,
);
assert(edited.toplamTutar === '30.00' && (await cash()) === '130.00' && (await stock()) === '7', 'Sale edit compensation failed');
await call(`/api/satis/${sale.id}`, 'DELETE', undefined, token);
assert((await cash()) === '100.00' && (await stock()) === '10', 'Sale deletion compensation failed');
const deferred = await call('/api/satis', 'POST', { sonraOdeme: true, stokHareketleriLists: [{ urunId: pid, miktar: 1 }] }, token);
await call(`/api/satis/${deferred.id}/collect-payment?paymentMethod=BANKA`, 'POST', {}, token);
assert((await cash()) === '100.00', 'Bank collection changed cash');
assert(
  (await response(`/api/satis/${deferred.id}/collect-payment?paymentMethod=BANKA`, 'POST', {}, token)).status === 409,
  'Repeated collection accepted',
);
await call(`/api/satis/${deferred.id}`, 'DELETE', undefined, token);
assert((await stock()) === '10' && (await cash()) === '100.00', 'Deferred sale deletion compensation failed');
const report = await call('/api/reports/stock-export', 'POST', {}, token);
let file: JsonObject | undefined;
for (let attempt = 0; attempt < 20; attempt++) {
  file = (await array('/api/report-files', token)).find(f => f.id === report.id);
  if (file) break;
  await new Promise(resolve => setTimeout(resolve, 3000));
}
assert(file, 'Queues/D1 report did not complete within 60 seconds');
const download = await response(`/api/report-files/${report.id}`, 'GET', undefined, token),
  bytes = new Uint8Array(await download.arrayBuffer());
assert(download.ok && bytes[0] === 0x50 && bytes[1] === 0x4b, 'D1 XLSX download invalid');
assert((await response(`/api/report-files/${report.id}`, 'GET', undefined, administrator)).status === 404, 'Cross-tenant report leaked');
const reconciliation = await call('/api/admin/tenant-reconciliation', 'POST', { tenantId: tid }, administrator);
const output = resolve(outputDirectory);
await mkdir(output, { recursive: true, mode: 0o700 });
const proof = join(output, `staging-smoke-${nonce}.json`);
await writeFile(
  proof,
  JSON.stringify(
    {
      url: base.origin,
      checkedAt: new Date().toISOString(),
      tenantId: tid,
      synthetic: true,
      checks: [
        'D1/auth',
        'tenant isolation',
        'authoritative totals/ownership',
        'idempotency',
        'stock/cash compensation',
        'deferred bank collection',
        'Queues/D1 report',
      ],
      reconciliation,
    },
    null,
    2,
  ) + '\n',
  { mode: 0o600, flag: 'wx' },
);
console.log(`Staging HTTP, financial and Queues/D1 checks passed. Private proof: ${proof}`);
