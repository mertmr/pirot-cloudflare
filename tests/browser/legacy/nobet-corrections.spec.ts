import { expect, test } from '@playwright/test';
import { authHeaders, createSale, getAdminToken, getCash, getStock, login } from './e2e-helpers';

// This journey deliberately retains closed history. Run against a disposable
// development/CI database; closed evidence must never be deleted as cleanup.
test('closed sale cancellation defers cash until confirmed settlement and preserves both closings', async ({ page, request }) => {
  const admin = await getAdminToken(request);
  const fixture = `shift-correction-${Date.now()}`;
  const credentials = { username: fixture, password: 'correction-test-password' };
  const registered = await request.post('/api/register', {
    headers: authHeaders(admin),
    data: {
      login: fixture,
      password: credentials.password,
      email: `${fixture}@example.invalid`,
      tenantId: 2,
      activated: true,
      langKey: 'tr',
    },
  });
  expect(registered.status()).toBe(201);
  const authenticated = await request.post('/api/authenticate', { data: credentials });
  expect(authenticated.status()).toBe(200);
  const token: string = (await authenticated.json()).id_token;
  const productResponse = await request.post('/api/uruns', {
    headers: authHeaders(token),
    data: {
      urunAdi: fixture,
      stok: 5,
      stokSiniri: 0,
      musteriFiyati: 100,
      birim: 'ADET',
      urunKategorisi: 'GIDA',
      active: true,
      satista: true,
    },
  });
  expect(productResponse.status()).toBe(201);
  const productId: number = (await productResponse.json()).id;
  const funded = await request.post('/api/virmen', {
    headers: authHeaders(token),
    data: { tarih: new Date().toISOString(), tutar: 1000, girisHesabi: 'KASA', cikisHesabi: 'BANKA', notlar: fixture },
  });
  expect(funded.status()).toBe(201);
  const baseline = await getCash(request, token);
  const shift = async (action: string) => {
    const response = await request.post('/api/nobet-hareketleris', {
      headers: authHeaders(token),
      data: { acilisKapanis: action, kasa: await getCash(request, token), notlar: fixture },
    });
    expect(response.status()).toBe(201);
    return response.json();
  };
  await shift('ACILIS');
  const sale = await createSale(request, token, productId, 1);
  const closing = await shift('KAPANIS');
  const opening = await shift('ACILIS');
  await login(page, credentials);
  await page.goto(`/satis/${sale.id}/delete`);
  const cancel = page.getByRole('button', { name: 'İptali kaydet', exact: true });
  await expect(cancel).toBeDisabled();
  await page.getByLabel('Düzeltme nedeni').fill(`${fixture}: refund will be delivered later`);
  await page.getByLabel('Nakit şimdi değişiyor mu?').selectOption('later');
  await expect(cancel).toBeEnabled();
  const cancelled = page.waitForResponse(r => r.url().includes(`/api/satis/${sale.id}`) && r.request().method() === 'DELETE');
  await cancel.click();
  expect((await cancelled).status()).toBe(204);
  expect(await getCash(request, token)).toBeCloseTo(baseline + 100, 2);
  expect(await getStock(request, token, productId)).toBe(5);
  const source = await request.get(`/api/satis/${sale.id}`, { headers: authHeaders(token) });
  expect((await source.json()).iptal).toBe(true);

  await page.goto(`/nobet-hareketleri/${closing.id}`);
  await expect(page.getByRole('heading', { name: 'Kapanış anındaki kasa dökümü' })).toBeVisible();
  await page.getByRole('button', { name: 'Nakit ödemesini işle', exact: true }).click();
  const settled = page.waitForResponse(r => r.url().includes('/api/nobet-duzeltmeler/') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Evet, nakit teslim edildi', exact: true }).click();
  expect((await settled).status()).toBe(200);
  await expect(page.getByRole('button', { name: 'Nakit ödemesini işle', exact: true })).toHaveCount(0);
  expect(await getCash(request, token)).toBeCloseTo(baseline, 2);
  const original = await request.get(`/api/nobet-hareketleris/${closing.id}`, { headers: authHeaders(token) });
  const originalAfter = await original.json();
  for (const field of ['kasa', 'pirot', 'fark', 'farkDenge', 'acilisId', 'kapanisDokumu']) {
    expect(originalAfter[field]).toEqual(closing[field]);
  }
  const currentClosing = await shift('KAPANIS');
  expect(currentClosing.acilisId).toBe(opening.id);
  expect(Number(currentClosing.kasa)).toBeCloseTo(baseline, 2);
  expect(currentClosing.fark).toBe('0.00');
  const history = await request.get(`/api/nobet-duzeltmeler/nobet/${currentClosing.id}`, { headers: authHeaders(token) });
  const audits = await history.json();
  expect(audits).toHaveLength(1);
  expect(audits[0]).toMatchObject({
    kaynakId: sale.id,
    kapanisId: closing.id,
    nobetAcilisId: opening.id,
    bekleyenKasa: '0.00',
    odemeNobetId: opening.id,
  });
});
