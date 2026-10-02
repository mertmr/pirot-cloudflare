import { Page, expect, test } from '@playwright/test';

import { deleteEntityIfExists, findEntityByField, getAdminToken, getStock, login, uniqueNote } from './e2e-helpers';

// Serial: the spec mutates product stock and must not overlap with itself.
test.describe.configure({ mode: 'serial' });

// Deterjan (seeded: 40 ADET) is intentionally unused by the other specs so its
// stock deltas never collide with the sale specs.
const PRODUCT = { id: 10, name: 'Deterjan', unit: 'ADET' };

interface StokGirisiRecord {
  id: number;
  miktar?: number;
  notlar?: string;
  stokHareketiTipi?: string;
  urunAdi?: string;
}

async function selectProduct(page: Page, productId: number): Promise<void> {
  await expect(page.locator(`#stok-girisi-urun option[value="${productId}"]`)).toHaveCount(1);
  await page.locator('#stok-girisi-urun').selectOption(String(productId));
}

async function deleteStokGirisiThroughDialog(page: Page, id: number): Promise<void> {
  await page.goto(`/stok-girisi/${id}/delete`, { waitUntil: 'domcontentloaded' });
  const dialog = page.locator('.modal-content');
  await expect(dialog).toContainText(String(id), { timeout: 15_000 });
  await dialog.locator('[data-cy="entityConfirmDeleteButton"]').click();
  await page.waitForURL(/\/stok-girisi(\?|$)/, { timeout: 15_000 });
}

test.describe('Stok girisi lifecycle', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getAdminToken(request);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('creating, editing and deleting a STOK_GIRISI compensates product stock', async ({ page, request }) => {
    const stock0 = await getStock(request, token, PRODUCT.id);
    const note = uniqueNote('E2E stok girisi');
    let stokGirisiId: number | undefined;

    try {
      await page.goto('/stok-girisi/new', { waitUntil: 'domcontentloaded' });
      await selectProduct(page, PRODUCT.id);
      await expect(page.getByText(`Güncel Stok: ${stock0} ${PRODUCT.unit}`)).toBeVisible();

      await page.locator('#stok-girisi-miktar').fill('7');
      await expect(page.locator('[data-cy="yeni-stok"]')).toContainText(`Kaydedilecek Yeni Stok: ${stock0 + 7} ${PRODUCT.unit}`);
      await page.locator('#stok-girisi-notlar').fill(note);
      await page.locator('#save-entity').click();
      await page.waitForURL(/\/stok-girisi(\?|$)/, { timeout: 15_000 });

      stokGirisiId = (await findEntityByField<StokGirisiRecord>(request, token, '/api/stok-girisis', 'notlar', note)).id;
      expect(await getStock(request, token, PRODUCT.id)).toBe(stock0 + 7);

      // On edit the persisted effect is reverted before the replacement applies.
      await page.goto(`/stok-girisi/${stokGirisiId}/edit`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#stok-girisi-notlar')).toHaveValue(note);
      await expect(page.locator('[data-cy="yeni-stok"]')).toContainText(`Kaydedilecek Yeni Stok: ${stock0 + 7} ${PRODUCT.unit}`);

      await page.locator('#stok-girisi-miktar').fill('3');
      await expect(page.locator('[data-cy="yeni-stok"]')).toContainText(`Kaydedilecek Yeni Stok: ${stock0 + 3} ${PRODUCT.unit}`);
      await page.locator('#save-entity').click();
      await page.waitForURL(/\/stok-girisi(\?|$)/, { timeout: 15_000 });
      expect(await getStock(request, token, PRODUCT.id)).toBe(stock0 + 3);

      await deleteStokGirisiThroughDialog(page, stokGirisiId);
      expect(await getStock(request, token, PRODUCT.id)).toBe(stock0);
    } finally {
      await deleteEntityIfExists(request, token, '/api/stok-girisis', stokGirisiId);
    }
  });

  test('a FIRE beyond available stock is rejected without mutating stock', async ({ page, request }) => {
    const stock0 = await getStock(request, token, PRODUCT.id);

    await page.goto('/stok-girisi/new', { waitUntil: 'domcontentloaded' });
    await selectProduct(page, PRODUCT.id);
    await page.locator('#stok-girisi-miktar').fill('9999');
    await page.locator('#stok-girisi-stokHareketiTipi').selectOption('FIRE');
    await page.locator('#stok-girisi-notlar').fill(uniqueNote('E2E fire'));

    const rejection = page.waitForResponse(
      response => response.url().includes('/api/stok-girisis') && response.request().method() === 'POST',
    );
    await page.locator('#save-entity').click();
    const rejected = await rejection;
    expect(rejected.status()).toBe(409);
    expect((await rejected.json()).errorKey).toBe('insufficientstock');

    // The server rejected the movement; the form stays put and stock is untouched.
    await expect(page).toHaveURL(/\/stok-girisi\/new/);
    expect(await getStock(request, token, PRODUCT.id)).toBe(stock0);
  });
});
