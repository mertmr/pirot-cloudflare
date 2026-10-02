import { Page, expect, test } from '@playwright/test';

import { deleteEntityIfExists, findEntityByField, getAdminToken, getCash, login, uniqueNote } from './e2e-helpers';

// Serial: the spec mutates the shared cash ledger and must not overlap with itself.
test.describe.configure({ mode: 'serial' });

interface VirmanRecord {
  id: number;
  tutar?: number;
  notlar?: string;
  cikisHesabi?: string;
  girisHesabi?: string;
}

async function deleteVirmanThroughDialog(page: Page, id: number): Promise<void> {
  await page.goto(`/virman/${id}/delete`, { waitUntil: 'domcontentloaded' });
  const dialog = page.locator('.modal-content');
  await expect(dialog).toContainText(String(id), { timeout: 15_000 });
  await dialog.locator('[data-cy="entityConfirmDeleteButton"]').click();
  await page.waitForURL(/\/virman(\?|$)/, { timeout: 15_000 });
}

test.describe('Virman cash lifecycle', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getAdminToken(request);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a KASA -> BANKA transfer is reversed when updated and deleted', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const note = uniqueNote('E2E virman');
    let virmanId: number | undefined;

    try {
      await page.goto('/virman/new', { waitUntil: 'domcontentloaded' });
      await page.locator('#virman-tutar').fill('75.25');
      await page.locator('#virman-cikisHesabi').selectOption('KASA');
      await page.locator('#virman-girisHesabi').selectOption('BANKA');
      await page.locator('#virman-notlar').fill(note);
      await page.locator('#save-entity').click();
      await page.waitForURL(/\/virman(\?|$)/, { timeout: 15_000 });

      virmanId = (await findEntityByField<VirmanRecord>(request, token, '/api/virmen', 'notlar', note)).id;
      expect(await getCash(request, token)).toBeCloseTo(cash0 - 75.25, 2);

      // Flipping the direction reverses the old effect before applying the new one.
      await page.goto(`/virman/${virmanId}/edit`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#virman-notlar')).toHaveValue(note);
      await page.locator('#virman-cikisHesabi').selectOption('BANKA');
      await page.locator('#virman-girisHesabi').selectOption('KASA');
      await page.locator('#save-entity').click();
      await page.waitForURL(/\/virman(\?|$)/, { timeout: 15_000 });
      expect(await getCash(request, token)).toBeCloseTo(cash0 + 75.25, 2);

      await deleteVirmanThroughDialog(page, virmanId);
      expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
    } finally {
      await deleteEntityIfExists(request, token, '/api/virmen', virmanId);
    }
  });

  test('a KASA -> KASA transfer is rejected without changing cash', async ({ page, request }) => {
    const cash0 = await getCash(request, token);
    const note = uniqueNote('E2E virman ayni hesap');
    await page.goto('/virman/new', { waitUntil: 'domcontentloaded' });
    await page.locator('#virman-tutar').fill('10');
    await page.locator('#virman-cikisHesabi').selectOption('KASA');
    await page.locator('#virman-girisHesabi').selectOption('KASA');
    await page.locator('#virman-notlar').fill(note);
    const rejected = page.waitForResponse(r => r.url().endsWith('/api/virmen') && r.request().method() === 'POST');
    await page.locator('#save-entity').click();
    const response = await rejected;
    expect(response.status()).toBe(400);
    expect((await response.json()).errorKey).toBe('invalidpayment');
    await expect(page).toHaveURL(/\/virman\/new/);
    expect(await getCash(request, token)).toBeCloseTo(cash0, 2);
  });
});
