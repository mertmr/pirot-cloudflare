import { expect, test } from '@playwright/test';

import { login } from './e2e-helpers';

test.describe('Satis List Screen', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to Satis list screen', async ({ page }, testInfo) => {
    await page.goto('/satis', { waitUntil: 'domcontentloaded' });

    const title = page.locator('#satis-heading');
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#jh-create-entity')).toBeVisible();

    await page.screenshot({ path: testInfo.outputPath('satis-list-screen.png') });
  });

  test('should display Satis list with columns', async ({ page }) => {
    await page.goto('/satis', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#satis-heading')).toBeVisible();

    const table = page.locator('.table-responsive table');
    await expect(table).toBeVisible({ timeout: 10000 });

    await expect(page.locator('th:has-text("ID")')).toBeVisible();
  });

  test('should have create button', async ({ page }) => {
    await page.goto('/satis', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#satis-heading')).toBeVisible();

    // Verify create button exists and is enabled
    const createButton = page.locator('#jh-create-entity');
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/satis', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#satis-heading')).toBeVisible();

    // Verify search input exists
    const searchInput = page.locator('input[placeholder="Kullanıcıya Göre Satış Ara"]');
    await expect(searchInput).toBeVisible();

    // Verify search button exists (FontAwesome 7 canonical name for faSearch)
    const searchButton = page.locator('button:has(svg[data-icon="magnifying-glass"])');
    await expect(searchButton).toBeVisible();
  });

  test('should display no records message when empty', async ({ page }) => {
    await page.goto('/satis', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#satis-heading')).toBeVisible();

    const noRecordsAlert = page.getByText(/No Satis found|Satış bulunamadı/i);
    const tableRows = page.locator('.table-responsive table tbody tr');

    await expect(tableRows.first().or(noRecordsAlert)).toBeVisible({ timeout: 10000 });
  });

  test('should have pagination if records exist', async ({ page }) => {
    await page.goto('/satis', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#satis-heading')).toBeVisible();

    // Check if table has rows
    const tableRows = page.locator('.table-responsive table tbody tr');
    const rowCount = await tableRows.count();

    // Only check pagination if there are records
    if (rowCount > 0) {
      // Verify pagination component is visible
      const pagination = page.locator('.pagination');
      await expect(pagination).toBeVisible();
    }
  });
});
