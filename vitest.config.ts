import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { app: path.resolve('src/client'), 'react-jhipster': path.resolve('src/client/shared/jhipster/index.ts') } },
  define: { SERVER_API_URL: JSON.stringify(''), DEVELOPMENT: 'true', VERSION: JSON.stringify('2.0.0') },
  test: { include: ['tests/**/*.test.ts'], testTimeout: 30000, hookTimeout: 60000, fileParallelism: false },
});
