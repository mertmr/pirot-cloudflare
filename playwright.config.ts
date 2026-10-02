import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  globalSetup: './tests/browser/setup.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:9070',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list']],
  webServer: {
    command: 'bun run dev',
    url: 'http://127.0.0.1:9070/management/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
