import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  globalSetup: './tests/browser/setup.ts',
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:9071',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list']],
  webServer: {
    command: 'node scripts/browser-server.mjs',
    url: 'http://127.0.0.1:9071/management/health',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
