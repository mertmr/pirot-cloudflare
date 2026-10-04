import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('restores the authenticated developer session', { tags: ['smoke'], session: 'developer' }, async ({ app, browser }) => {
  await app.open('/');
  await expect(browser.locator('#account-menu')).toBeVisible();
});

test('agent navigates to product management', { tags: ['agentic'], session: 'developer' }, async ({ app, agent, browser }) => {
  await app.open('/');
  await agent.act('Open the Ürün product list from the Varlıklar menu.');
  await expect(browser).toHaveURL('/urun');
});
