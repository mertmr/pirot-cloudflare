import { expect } from '@playwright/test';
import { ADMIN } from './e2e-helpers';
export async function seedLegacyFixtures() {
  const base = 'http://127.0.0.1:9071';
  const authenticated = await fetch(`${base}/api/authenticate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'developer', password: 'Synthetic-local-password-42' }),
  });
  expect(authenticated.status).toBe(200);
  let token = ((await authenticated.json()) as { id_token: string }).id_token;
  const post = async (path: string, data: unknown) => {
    const response = await fetch(`${base}/api/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'idempotency-key': crypto.randomUUID() },
      body: JSON.stringify(data),
    });
    expect(response.status, `${path}: ${await response.clone().text()}`).toBe(201);
    return response.json() as Promise<{ id: number }>;
  };
  expect((await post('tenants', { tenantName: 'Synthetic rounding and correction cooperative' })).id).toBe(2);
  const tenant = await post('tenants', { tenantName: 'Synthetic legacy E2E cooperative' });
  await post('admin/users', {
    login: ADMIN.username,
    password: ADMIN.password,
    email: 'e2e-admin@example.invalid',
    tenantId: tenant.id,
    activated: true,
    authorities: ['ROLE_ADMIN', 'ROLE_USER'],
  });
  const auth = await fetch(`${base}/api/authenticate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(ADMIN),
  });
  expect(auth.status).toBe(200);
  token = ((await auth.json()) as { id_token: string }).id_token;
  const products = [
    ['Organik Elma', '150', '45.50', 'ADET'],
    ['Yumurta', '200', '9.00', 'ADET'],
    ['Bal', '25', '100.00', 'GRAM'],
    ['Synthetic reserved 4', '100', '10.00', 'ADET'],
    ['Limon', '95', '12.50', 'ADET'],
    ['Sabun', '100', '20.00', 'ADET'],
    ['Synthetic reserved 7', '100', '10.00', 'ADET'],
    ['Synthetic reserved 8', '100', '10.00', 'ADET'],
    ['Synthetic reserved 9', '100', '10.00', 'ADET'],
    ['Deterjan', '40', '30.00', 'ADET'],
  ];
  for (const [index, p] of products.entries()) {
    expect(
      (
        await post('uruns', {
          urunAdi: p[0],
          stok: p[1],
          musteriFiyati: p[2],
          birim: p[3],
          stokSiniri: '0',
          active: true,
          satista: true,
          urunKategorisi: 'GIDA',
        })
      ).id,
    ).toBe(index + 1);
  }
  await post('kasa-hareketleris', { kasaMiktar: '1000.00', hareket: 'Synthetic E2E opening balance' });
  await post('satis', {
    tarih: new Date().toISOString(),
    stokHareketleriLists: [{ urunId: 7, miktar: '1' }],
    kartliSatis: true,
    sonraOdeme: false,
    ortagaSatis: false,
  });
  for (const acilisKapanis of ['ACILIS', 'KAPANIS'])
    await post('nobet-hareketleris', { acilisKapanis, kasa: '1000.00', notlar: 'Synthetic E2E baseline shift' });
}
