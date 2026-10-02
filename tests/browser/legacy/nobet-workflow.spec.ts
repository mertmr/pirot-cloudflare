import { Page, expect, test } from '@playwright/test';

import { login } from './e2e-helpers';

// Serial because the journey mutates the shift lifecycle for the admin user.
test.describe.configure({ mode: 'serial' });

async function listRowCount(page: Page) {
  await page.goto('/nobet-hareketleri', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.table-responsive table tbody tr').first()).toBeVisible({ timeout: 10_000 });
  return page.locator('.table-responsive table tbody tr').count();
}

// Closes an active opening so the journey always starts from the idle state.
// Local dev databases may hold residue from manual testing; CI starts clean.
async function closeActiveShift(page: Page) {
  await page.locator('[data-cy="money-100"]').fill('1');
  const difference = await page.locator('[data-cy="fark"]').inputValue();
  if (difference !== '0.00') {
    await page.locator('[data-cy="notlar"]').fill('E2E: önceki açılışın kapanışı');
  }
  await page.locator('#save-entity').click();
  await expect(page).toHaveURL(/\/nobet-hareketleri(\?|$)/, { timeout: 15_000 });
}

test.describe('Nobet shift workflow', () => {
  test('opens a shift with an explained cash difference, closes it balanced, and returns to idle', async ({ page }) => {
    await login(page);
    const baselineRows = await listRowCount(page);

    await page.goto('/nobet-hareketleri/new', { waitUntil: 'domcontentloaded' });

    const startHeading = page.getByRole('heading', { name: /Nöbeti Başlat/ });
    const closeHeading = page.getByRole('heading', { name: /Nöbeti Kapat/ });
    await expect(startHeading.or(closeHeading)).toBeVisible({ timeout: 10_000 });

    let rowCount = baselineRows;
    if (await closeHeading.isVisible()) {
      await closeActiveShift(page);
      rowCount += 1;
    }

    // Idle state: the server dictates an opening with its own system cash.
    await page.goto('/nobet-hareketleri/new', { waitUntil: 'domcontentloaded' });
    await expect(startHeading).toBeVisible({ timeout: 10_000 });
    const expectedText = await page.locator('[data-cy="expected-cash"]').innerText();
    const expectedCash = Number.parseFloat(expectedText);
    expect(Number.isFinite(expectedCash)).toBe(true);

    const save = page.locator('#save-entity');
    await expect(save).toBeDisabled();

    // Count 100 TL: unless it matches the system cash, an explanation is mandatory.
    await page.locator('[data-cy="money-100"]').fill('1');
    await expect(page.locator('[data-cy="kasa"]')).toHaveValue('100.00');
    const difference = (100 - expectedCash).toFixed(2);
    await expect(page.locator('[data-cy="fark"]')).toHaveValue(difference);

    if (difference !== '0.00') {
      await expect(save).toBeDisabled();
      await expect(page.locator('[data-cy="notlar"]')).toHaveClass(/is-invalid/);
      await page.locator('[data-cy="notlar"]').fill('E2E: kasa farkı açıklaması');
    }
    await expect(save).toBeEnabled();
    await save.click();

    // The list gains the opening row.
    await expect(page).toHaveURL(/\/nobet-hareketleri(\?|$)/, { timeout: 15_000 });
    await expect(page.locator('.table-responsive table tbody tr')).toHaveCount(++rowCount);

    // With an active opening, the screen becomes the closing view and shows
    // the server-computed expected cash breakdown. Counting a shift does not
    // touch the cash ledger, so the expected cash is still the system cash
    // shown at opening time.
    await page.goto('/nobet-hareketleri/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Nöbeti Kapat/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-cy="expected-cash-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-cy="pirot"]')).toHaveValue(expectedCash.toFixed(2));

    // Close with a count (any imbalance is explained, as at opening).
    await page.locator('[data-cy="money-100"]').fill('1');
    const closeDifference = (100 - expectedCash).toFixed(2);
    await expect(page.locator('[data-cy="fark"]')).toHaveValue(closeDifference);
    if (closeDifference !== '0.00') {
      await page.locator('[data-cy="notlar"]').fill('E2E: kapanış farkı açıklaması');
    }
    await page.locator('#save-entity').click();

    await expect(page).toHaveURL(/\/nobet-hareketleri(\?|$)/, { timeout: 15_000 });
    await expect(page.locator('.table-responsive table tbody tr')).toHaveCount(rowCount + 1);

    // The lifecycle is complete: the next visit starts a new opening.
    await page.goto('/nobet-hareketleri/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Nöbeti Başlat/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-cy="expected-cash"]')).toBeVisible();
  });
});
