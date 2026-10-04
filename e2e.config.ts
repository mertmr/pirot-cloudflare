import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { chatgpt } from 'e2e/oauth/chatgpt';

export default {
  tests: 'tests/e2e/**/*.e2e.ts',
  targets: [
    {
      name: 'chromium',
      engine: web({
        browser: 'chromium',
        locale: 'tr-TR',
        timezoneId: 'Europe/Istanbul',
        testIdAttribute: 'data-cy',
      }),
      app: {
        url: 'http://127.0.0.1:9071',
        readyUrl: 'http://127.0.0.1:9071/management/health',
        command: {
          executable: 'node',
          args: ['scripts/browser-server.mjs'],
          startupTimeout: 60_000,
          log: '.e2e/logs/app.log',
        },
      },
    },
  ],
  workers: 1,
  timeout: 120_000,
  trace: 'retain-on-failure',
  credentials: {
    developer: {
      username: 'developer',
      password: process.env.PIROT_DEV_PASSWORD ?? 'Synthetic-local-password-42',
    },
  },
  agents: {
    default: {
      model: chatgpt(process.env.PIROT_E2E_MODEL ?? 'gpt-6-luna'),
      system:
        'You test Pirot, a Turkish cooperative management app. Prefer visible navigation and verify the requested destination before finishing.',
    },
  },
} satisfies E2EConfig;
