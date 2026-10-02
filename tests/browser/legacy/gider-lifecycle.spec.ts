import { Page, expect, test } from '@playwright/test';

import { deleteEntityIfExists, findEntityByField, getAdminToken, getCash, login, uniqueNote } from './e2e-helpers';

// Serial: the spec mutates the shared cash ledger and must not overlap with itself.
test.describe.configure({ mode: 'serial' });

interface GiderRecord {
  id: number;
  tutar?: number;
  notlar?: string;
  odemeAraci?: string;
}

async function deleteGiderThroughDialog(page: Page, id: number): Promise<void> {
  await page.goto(`/gider/${id}/delete`, { waitUntil: 'domcontentloaded' });
  const dialog = page.locator('.modal-content');
  await expect(dialog).toContainText(String(id), { timeout: 15_000 });
  await dialog.locator('[data-cy="entityConfirmDeleteButton"]').click();
  await page.waitForURL(/\/gider(\?|$)/, { timeout: 15_000 });
}

test.describe('Gider cash lifecycle', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getAdminToken(request);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a NAKIT expense moves kasa by its amount on create, update and delete', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const note = uniqueNote('E2E nakit gider');
    let giderId: number | undefined;

    try {
      await page.goto('/gider/new', { waitUntil: 'domcontentloaded' });
      await page.locator('#gider-tutar').fill('100.50');
      await page.locator('#gider-odemeAraci').selectOption('NAKIT');
      await page.locator('#gider-notlar').fill(note);
      await page.locator('#save-entity').click();
      await page.waitForURL(/\/gider(\?|$)/, { timeout: 15_000 });

      giderId = (await findEntityByField<GiderRecord>(request, token, '/api/giders', 'notlar', note)).id;
      expect(await getCash(request, token)).toBeCloseTo(cash0 - 100.5, 2);
      await expect(page.locator('tbody tr', { hasText: note })).toBeVisible();

      // Editing the amount reverses the old ledger effect before applying the new one.
      await page.goto(`/gider/${giderId}/edit`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#gider-notlar')).toHaveValue(note);
      await page.locator('#gider-tutar').fill('40');
      await page.locator('#save-entity').click();
      await page.waitForURL(/\/gider(\?|$)/, { timeout: 15_000 });
      expect(await getCash(request, token)).toBeCloseTo(cash0 - 40, 2);

      await deleteGiderThroughDialog(page, giderId);
      expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
    } finally {
      await deleteEntityIfExists(request, token, '/api/giders', giderId);
    }
  });

  test('a BANKA expense never touches kasa', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const note = uniqueNote('E2E banka gider');
    let giderId: number | undefined;

    try {
      await page.goto('/gider/new', { waitUntil: 'domcontentloaded' });
      await page.locator('#gider-tutar').fill('55.25');
      await page.locator('#gider-odemeAraci').selectOption('BANKA');
      await page.locator('#gider-notlar').fill(note);
      await page.locator('#save-entity').click();
      await page.waitForURL(/\/gider(\?|$)/, { timeout: 15_000 });

      giderId = (await findEntityByField<GiderRecord>(request, token, '/api/giders', 'notlar', note)).id;
      expect(await getCash(request, token)).toBeCloseTo(cash0, 2);

      await deleteGiderThroughDialog(page, giderId);
      expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
    } finally {
      await deleteEntityIfExists(request, token, '/api/giders', giderId);
    }
  });
});
