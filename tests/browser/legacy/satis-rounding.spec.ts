import { expect, test } from '@playwright/test';

import { ADMIN, authHeaders, getAdminToken, getCash, getStock, login, posSaveButton } from './e2e-helpers';

test.describe.configure({ mode: 'serial' });

for (const scenario of [
  { name: 'fractional exact cash', tenant: 1, price: 12.25, discount: 0, total: 12.25 },
  { name: 'discount rounding at a quarter boundary', tenant: 2, price: 1.25, discount: 10, total: 1.25 },
]) {
  test(`checkout persists ${scenario.name} and reverses cash and stock on deletion`, async ({ page, request }) => {
    const adminToken = await getAdminToken(request);
    const fixtureName = `rounding-${Date.now()}-${scenario.tenant}`;
    let credentials: { username: string; password: string } = ADMIN;
    let token = adminToken;
    let productId: number | undefined;
    let saleId: number | undefined;
    let registeredUser = false;

    try {
      if (scenario.tenant === 2) {
        credentials = { username: fixtureName, password: 'rounding-test-password' };
        const registration = await request.post('/api/register', {
          headers: authHeaders(adminToken),
          data: {
            login: credentials.username,
            password: credentials.password,
            email: `${fixtureName}@example.invalid`,
            tenantId: 2,
            activated: true,
            langKey: 'tr',
          },
        });
        expect(registration.status()).toBe(201);
        registeredUser = true;
        const authentication = await request.post('/api/authenticate', { data: credentials });
        expect(authentication.status()).toBe(200);
        token = (await authentication.json()).id_token;
      }

      const createdProduct = await request.post('/api/uruns', {
        headers: authHeaders(token),
        data: {
          urunAdi: fixtureName,
          stok: 5,
          stokSiniri: 0,
          musteriFiyati: scenario.price,
          birim: 'ADET',
          urunKategorisi: 'GIDA',
          active: true,
          satista: true,
          dayanismaUrunu: false,
        },
      });
      expect(createdProduct.status()).toBe(201);
      productId = (await createdProduct.json()).id;
      const cashBefore = await getCash(request, token);
      await login(page, credentials);
      await page.goto('/satis/new');
      const search = page.getByRole('combobox');
      await search.fill(fixtureName);
      await page.getByRole('option', { name: new RegExp(fixtureName) }).click();
      if (scenario.discount) {
        await page.getByText('Diğer seçenekler', { exact: true }).click();
        await page.locator('#satis-indirim').fill(String(scenario.discount));
      }
      await page.getByRole('button', { name: 'Tam tutar', exact: true }).click();
      await expect(page.locator('#satis-nakit')).toHaveValue(String(scenario.total));
      expect(await page.locator('#satis-nakit').evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(true);

      const saved = page.waitForResponse(response => response.url().endsWith('/api/satis') && response.request().method() === 'POST');
      await posSaveButton(page).click();
      const saleResponse = await saved;
      expect(saleResponse.status()).toBe(201);
      const sale = await saleResponse.json();
      saleId = sale.id;
      expect(sale.toplamTutar).toBe(scenario.total.toFixed(2));
      await expect(page.getByText('Satış tamamlandı', { exact: true })).toBeVisible();
      expect(await getCash(request, token)).toBeCloseTo(cashBefore + scenario.total, 2);
      expect(await getStock(request, token, productId!)).toBe(4);

      const deleted = await request.delete(`/api/satis/${saleId}`, { headers: authHeaders(token) });
      expect(deleted.status()).toBe(204);
      saleId = undefined;
      expect(await getCash(request, token)).toBeCloseTo(cashBefore, 2);
      expect(await getStock(request, token, productId!)).toBe(5);
    } finally {
      if (saleId) await request.delete(`/api/satis/${saleId}`, { headers: authHeaders(token) });
      if (productId) await request.delete(`/api/uruns/${productId}`, { headers: authHeaders(token) });
      if (registeredUser) await request.delete(`/api/admin/users/${credentials.username}`, { headers: authHeaders(adminToken) });
    }
  });
}
