import { readFileSync } from 'node:fs';
import { test } from '@e2e-dev/web';
import { credentials, expect } from 'e2e';

const vars = Object.fromEntries(
  readFileSync('.dev.vars', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const bootstrapSecret = vars.BOOTSTRAP_SECRET;
if (!bootstrapSecret) throw new Error('BOOTSTRAP_SECRET is missing from .dev.vars');

test.setup('developer session', { sessions: ['developer'] }, async ({ app, screen, session, browser }) => {
  if (!app.baseUrl) throw new Error('E2E app base URL is unavailable');

  const developer = credentials.user('developer');
  const response = await fetch(`${app.baseUrl}/api/internal/bootstrap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-bootstrap-secret': bootstrapSecret },
    body: JSON.stringify({
      login: developer.username,
      email: 'developer@example.invalid',
      password: process.env.PIROT_DEV_PASSWORD ?? 'Synthetic-local-password-42',
      tenantId: 1,
      tenantName: 'Local synthetic cooperative',
    }),
  });

  if (!response.ok && response.status !== 409) throw new Error(`Bootstrap failed: ${response.status} ${await response.text()}`);

  await app.open('/login');
  await screen.getByTestId('username').fill(developer.username);
  await screen.getByTestId('password').fill(developer.password);
  await screen.getByTestId('submit').tap();
  await expect(browser.locator('#account-menu')).toBeVisible();
  await session.save('developer');
});
