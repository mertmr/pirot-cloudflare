import { expect, test } from '@playwright/test';
import { login } from './e2e-helpers';
// The former Spring SystemMetrics screen is now the Cloudflare operations screen.
test('Cloudflare operations render authenticated D1 diagnostics without client errors', async ({ page }) => {
  await login(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = page.waitForResponse(r => r.url().includes('/api/cooperative-operations'));
  await page.goto('/admin/metrics');
  await expect(page.getByRole('heading', { name: 'Cloudflare İşlemleri' })).toBeVisible();
  expect((await response).status()).toBe(200);
  await expect(page.getByText('Cloudflare D1 panelinde görüntüleyin')).toBeVisible();
  expect(errors).toEqual([]);
});
