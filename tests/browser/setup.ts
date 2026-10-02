import { spawnSync } from 'node:child_process';

const base = 'http://127.0.0.1:9071';

/**
 * Provisions the disposable browser fixtures: tenant 1 with the synthetic
 * developer identity, then tenant 2 for the discount and shift-correction
 * workflows. The server's discount rule is keyed to tenant id 2, so the id is
 * asserted rather than assumed.
 */
export default async function setup() {
  const result = spawnSync('node', ['scripts/local-seed.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, PIROT_LOCAL_URL: base },
  });
  if (result.status !== 0) throw new Error('Synthetic local browser fixture setup failed');

  const authenticated = await fetch(`${base}/api/authenticate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'developer', password: 'Synthetic-local-password-42' }),
  });
  if (authenticated.status !== 200) throw new Error(`Synthetic browser admin login failed: ${authenticated.status}`);
  const { id_token: token } = (await authenticated.json()) as { id_token: string };

  const created = await fetch(`${base}/api/tenants`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'idempotency-key': crypto.randomUUID() },
    body: JSON.stringify({ tenantName: 'Synthetic secondary cooperative' }),
  });
  if (!created.ok) throw new Error(`Synthetic secondary cooperative setup failed: ${created.status} ${await created.text()}`);
  const tenant = (await created.json()) as { id: number };
  if (tenant.id !== 2) throw new Error(`Expected the secondary cooperative to be tenant 2, received ${tenant.id}`);

  console.log('Synthetic browser fixtures ready, including tenant 2 for discount and shift-correction workflows.');
}
