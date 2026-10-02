import { expect, test } from '@playwright/test';

test.describe('Application Startup', () => {
  test('should load application', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation')).toBeVisible();

    await expect(page).toHaveTitle(/pirot/i);
    await page.screenshot({ path: testInfo.outputPath('app-loaded.png') });
  });

  test('should render the application navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should display login link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation')).toBeVisible();

    await expect(page.locator('#account-menu')).toBeVisible();
    await page.locator('#account-menu').click();
    await expect(page.locator('#login-item')).toBeVisible();
  });
});
