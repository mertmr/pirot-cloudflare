import { expect, test } from '@playwright/test';

import { createSale, deleteSaleIfExists, getAdminToken, getCash, getDebtsForSale, getSale, getStock, login } from './e2e-helpers';

// Serial: the spec mutates cash/stock/debt and must not overlap with itself.
test.describe.configure({ mode: 'serial' });

// Sabun is intentionally unused by the other specs so stock deltas never collide.
const PRODUCT_ID = 6;

test.describe('Borc alacak collect payment', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getAdminToken(request);
  });

  test('collecting a deferred payment from the debt list credits kasa and settles the debt', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const stock0 = await getStock(request, token, PRODUCT_ID);
    const saleId = (await createSale(request, token, PRODUCT_ID, 1, { deferred: true })).id;

    try {
      const debts = await getDebtsForSale(request, token, saleId);
      expect(debts).toHaveLength(1);
      const debt = debts[0];
      expect(debt.hareketTipi).toBe('BORC');
      expect(debt.odemeAraci).toBe('SONRA_ODEME');
      const amount = Number(debt.tutar);

      await login(page);
      await page.goto('/borc-alacak', { waitUntil: 'domcontentloaded' });

      const row = page.locator('tbody tr', { hasText: String(debt.id) });
      await expect(row).toBeVisible({ timeout: 15_000 });
      await row.locator('[data-cy="collectPaymentButton"]').click();

      const dialog = page.locator('.modal-content');
      await expect(dialog).toBeVisible();
      const confirm = dialog.locator('[data-cy="confirmCollectPayment"]');
      await expect(confirm).toBeDisabled();

      await dialog.getByRole('radio', { name: 'Nakit (Peşin)' }).check();
      await confirm.click();

      // Success closes the dialog and refreshes the row into its settled state.
      await expect(dialog).toBeHidden({ timeout: 15_000 });
      await expect(row.locator('[data-cy="collectPaymentButton"]')).toHaveCount(0);
      await expect(row).toContainText('Nakit (Peşin)');

      // The server owns the cash and paid-state effects.
      expect(await getCash(request, token)).toBeCloseTo(cash0 + amount, 2);
      const settled = await getDebtsForSale(request, token, saleId);
      expect(settled).toHaveLength(1);
      expect(settled[0].hareketTipi).toBe('ODEME');
      expect(settled[0].odemeAraci).toBe('NAKIT');
      const sale = await getSale(request, token, saleId);
      expect(sale.odendi).toBe(true);
      expect(sale.kartliSatis).toBe(false);
    } finally {
      await deleteSaleIfExists(request, token, saleId);
    }

    // Deleting a collected NAKIT deferred sale reverses the credit and stock.
    expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
    expect(await getStock(request, token, PRODUCT_ID)).toBe(stock0);
  });
});
