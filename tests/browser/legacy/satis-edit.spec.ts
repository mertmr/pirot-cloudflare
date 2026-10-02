import { expect, test } from '@playwright/test';

import {
  createSale,
  deleteSaleIfExists,
  getAdminToken,
  getCash,
  getDebtsForSale,
  getProduct,
  getSale,
  getStock,
  gotoSaleEditor,
  login,
  posSaveButton,
  roundToQuarter,
} from './e2e-helpers';

// Serial: the spec mutates cash/stock/debt and must not overlap with itself.
test.describe.configure({ mode: 'serial' });

// Limon is intentionally unused by the other sales specs (Organik Elma,
// Yumurta and Bal) so stock deltas never collide. Its price is read from the
// server because the dev schema stores `musteri_fiyati` as scale-0 numeric.
const PRODUCT_ID = 5;
const PRODUCT_NAME = 'Limon';

test.describe('Satis edit screen', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getAdminToken(request);
  });

  test('changing a cash sale quantity reconciles stock and cash', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const stock0 = await getStock(request, token, PRODUCT_ID);
    const product = await getProduct(request, token, PRODUCT_ID);
    const expectedTotal2 = roundToQuarter(Number(product.musteriFiyati) * 2);
    const saleId = (await createSale(request, token, PRODUCT_ID, 1)).id;

    try {
      await login(page);
      await gotoSaleEditor(page, saleId);

      const line = page.locator('article.sepet-satiri', { hasText: PRODUCT_NAME });
      await expect(line).toBeVisible({ timeout: 15_000 });
      await expect(line.getByRole('spinbutton')).toHaveValue('1');

      // The edit screen warns about recomputation and shows the persisted total.
      await expect(page.getByText('Bu satışın stok ve kasa etkileri yeniden hesaplanacaktır')).toBeVisible();
      await expect(page.getByText('Önceki toplam')).toBeVisible();

      await line.getByRole('button', { name: 'Miktarı artır' }).click();
      await expect(line.getByRole('spinbutton')).toHaveValue('2');

      await posSaveButton(page).click();
      await page.waitForURL(/\/satis(\?|$)/, { timeout: 15_000 });

      // The server re-prices the sale; the persisted ledger must match it.
      const updated = await getSale(request, token, saleId);
      const total2 = Number(updated.toplamTutar);
      expect(total2).toBeCloseTo(expectedTotal2, 2);
      expect(await getStock(request, token, PRODUCT_ID)).toBe(stock0 - 2);
      expect(await getCash(request, token)).toBeCloseTo(cash0 + total2, 2);
    } finally {
      await deleteSaleIfExists(request, token, saleId);
    }

    expect(await getStock(request, token, PRODUCT_ID)).toBe(stock0);
    expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
  });

  test('a deferred sale stays locked to deferred payment and keeps its debt in sync', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const stock0 = await getStock(request, token, PRODUCT_ID);
    const product = await getProduct(request, token, PRODUCT_ID);
    const expectedTotal2 = roundToQuarter(Number(product.musteriFiyati) * 2);
    const created = await createSale(request, token, PRODUCT_ID, 1, { deferred: true });
    const saleId = created.id;
    expect(created.odendi).toBe(false);

    try {
      await login(page);
      await gotoSaleEditor(page, saleId);

      const line = page.locator('article.sepet-satiri', { hasText: PRODUCT_NAME });
      await expect(line).toBeVisible({ timeout: 15_000 });

      // An already-deferred sale cannot switch payment method while editing.
      const paymentGroup = page.getByRole('radiogroup', { name: 'Ödeme türü' });
      await expect(paymentGroup.getByRole('radio', { name: 'Sonradan ödeme' })).toHaveAttribute('aria-checked', 'true');
      await expect(paymentGroup.getByRole('radio', { name: 'Nakit' })).toBeDisabled();
      await expect(paymentGroup.getByRole('radio', { name: 'Kart' })).toBeDisabled();

      await line.getByRole('button', { name: 'Miktarı artır' }).click();
      await expect(line.getByRole('spinbutton')).toHaveValue('2');

      await posSaveButton(page).click();
      await page.waitForURL(/\/satis(\?|$)/, { timeout: 15_000 });

      const updated = await getSale(request, token, saleId);
      const total2 = Number(updated.toplamTutar);
      expect(total2).toBeCloseTo(expectedTotal2, 2);
      expect(updated.odendi).toBe(false);
      expect(updated.sonraOdeme).toBe(true);

      // The deferred debt follows the new total; cash is never touched.
      const debts = await getDebtsForSale(request, token, saleId);
      expect(debts).toHaveLength(1);
      expect(debts[0].hareketTipi).toBe('BORC');
      expect(debts[0].odemeAraci).toBe('SONRA_ODEME');
      expect(Number(debts[0].tutar)).toBeCloseTo(total2, 2);
      expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
      expect(await getStock(request, token, PRODUCT_ID)).toBe(stock0 - 2);
    } finally {
      await deleteSaleIfExists(request, token, saleId);
    }

    expect(await getDebtsForSale(request, token, saleId)).toHaveLength(0);
    expect(await getStock(request, token, PRODUCT_ID)).toBe(stock0);
    expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
  });
});
