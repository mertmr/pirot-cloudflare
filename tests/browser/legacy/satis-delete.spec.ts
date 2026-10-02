import { expect, test } from '@playwright/test';

import { authHeaders, createSale, deleteSaleIfExists, getAdminToken, getCash, getDebtsForSale, getStock, login } from './e2e-helpers';

// Serial: the spec mutates cash/stock/debt and must not overlap with itself.
test.describe.configure({ mode: 'serial' });

// Limon (seeded: 95 ADET @ 12.50 TL) stays exclusive to the sale lifecycle specs.
const PRODUCT = { id: 5, name: 'Limon' };

test.describe('Satis delete dialog', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getAdminToken(request);
  });

  test('deleting a cash sale through the dialog restores stock and cash', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const stock0 = await getStock(request, token, PRODUCT.id);
    const saleId = (await createSale(request, token, PRODUCT.id, 2)).id;

    try {
      await login(page);
      await page.goto(`/satis/${saleId}/delete`, { waitUntil: 'domcontentloaded' });

      // The dialog only becomes actionable once the persisted sale is loaded.
      const dialog = page.locator('.modal-content');
      await expect(dialog).toContainText(String(saleId), { timeout: 15_000 });
      await dialog.locator('[data-cy="entityConfirmDeleteButton"]').click();

      await page.waitForURL(/\/satis(\?|$)/, { timeout: 15_000 });
      expect((await request.get(`/api/satis/${saleId}`, { headers: authHeaders(token) })).status()).toBe(404);
    } finally {
      await deleteSaleIfExists(request, token, saleId);
    }

    expect(await getStock(request, token, PRODUCT.id)).toBe(stock0);
    expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
  });

  test('deleting a deferred sale through the dialog removes its debt and restores stock', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const stock0 = await getStock(request, token, PRODUCT.id);
    const saleId = (await createSale(request, token, PRODUCT.id, 1, { deferred: true })).id;
    expect(await getDebtsForSale(request, token, saleId)).toHaveLength(1);

    try {
      await login(page);
      await page.goto(`/satis/${saleId}/delete`, { waitUntil: 'domcontentloaded' });

      const dialog = page.locator('.modal-content');
      await expect(dialog).toContainText(String(saleId), { timeout: 15_000 });
      await dialog.locator('[data-cy="entityConfirmDeleteButton"]').click();

      await page.waitForURL(/\/satis(\?|$)/, { timeout: 15_000 });
      expect((await request.get(`/api/satis/${saleId}`, { headers: authHeaders(token) })).status()).toBe(404);
      expect(await getDebtsForSale(request, token, saleId)).toHaveLength(0);
    } finally {
      await deleteSaleIfExists(request, token, saleId);
    }

    expect(await getStock(request, token, PRODUCT.id)).toBe(stock0);
    expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
  });
});
