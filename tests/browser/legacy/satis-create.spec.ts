import { Page, expect, test } from '@playwright/test';

import { login, getAdminToken } from './e2e-helpers';

// Runs serially so the created sale never interferes with the other tests.
test.describe.configure({ mode: 'serial' });

// The checkout screen renders two submit buttons (sticky mobile bar / desktop
// actions); only one is visible per viewport, so resolve whichever is shown.
const saveButton = (page: Page) => page.locator('#save-entity-desktop:visible, #save-entity:visible');

test.describe('Satis Create Screen', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/satis/new', { waitUntil: 'domcontentloaded' });
    await expect(saveButton(page)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.urun-arama input[role="combobox"]')).toBeVisible();
  });

  async function addToCart(page: Page, productName: string) {
    const searchInput = page.locator('.urun-arama input[role="combobox"]');
    await searchInput.click();
    await searchInput.fill(productName);
    const option = page.getByRole('option', { name: new RegExp(`^${productName}`) });
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
  }

  test('should clamp the first quantity of a low-stock GRAM product to available stock', async ({ page }) => {
    // Bal has 25 GRAM in stock; the cart default for GRAM products is a 100 g step.
    await addToCart(page, 'Bal');

    const line = page.locator('article.sepet-satiri', { hasText: 'Bal' });
    await expect(line).toBeVisible();
    await expect(line.getByRole('spinbutton')).toHaveValue('25');
    await expect(line).toContainText('Stok: 25');
  });

  test('should merge repeated products into one cart line', async ({ page }) => {
    await addToCart(page, 'Yumurta');
    await addToCart(page, 'Yumurta');

    await expect(page.locator('article.sepet-satiri')).toHaveCount(1);
    await expect(page.locator('article.sepet-satiri').getByRole('spinbutton')).toHaveValue('2');
  });

  test('should create a Satis end to end and show it in the list', async ({ page, request }) => {
    // Yumurta has 200 ADET in stock, so the default quantity of 1 is valid.
    await addToCart(page, 'Yumurta');
    await expect(page.locator('article.sepet-satiri').getByRole('spinbutton')).toHaveValue('1');

    // Satış Tarihi defaults to the current date-time (YYYY-MM-DDTHH:mm).
    await expect(page.locator('#satis-tarih')).toHaveValue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

    // Card payment: keeps this UI spec off the shared cash register so it can
    // never race the (API-level) kasa assertions in satis-invariants.spec.ts.
    const paymentGroup = page.getByRole('radiogroup', { name: 'Ödeme türü' });
    await paymentGroup.getByRole('radio', { name: 'Kart' }).click();
    await expect(paymentGroup.getByRole('radio', { name: 'Kart' })).toHaveAttribute('aria-checked', 'true');

    await saveButton(page).click();

    // Save lands on the completion screen with the persisted sale's id.
    await expect(page.getByText('Satış tamamlandı')).toBeVisible({ timeout: 15_000 });
    const detail = await page.locator('.satis-complete-card p').innerText();
    const saleId = detail.match(/(\d+) numaralı/)?.[1];
    expect(saleId).toBeTruthy();

    await page.goto('/satis', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#satis-heading')).toBeVisible();
    const firstRowInList = page.locator('.table-responsive table tbody tr').first();
    await expect(firstRowInList.locator('td').nth(0)).toHaveText(saleId ?? '');
    await expect(firstRowInList.locator('td').nth(2)).toHaveText('9.00');

    // Clean up the created sale via the API to keep the dev DB stable across runs.
    const token = await getAdminToken(request);
    const del = await request.delete(`/api/satis/${saleId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    });
    expect(del.status()).toBe(204);
  });
});
