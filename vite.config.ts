import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: 'ssr' },
      ...(process.env.PIROT_E2E === 'true' ? { persistState: { path: '.wrangler/e2e' } } : {}),
    }),
    tanstackStart(),
    react(),
  ],
  resolve: {
    alias: [
      { find: 'react-jhipster-legacy', replacement: path.resolve('node_modules/react-jhipster/lib') },
      { find: /^react-jhipster$/, replacement: path.resolve('src/client/shared/jhipster/index.ts') },
      { find: 'app', replacement: path.resolve('src/client') },
      { find: /^(node:)?path$/, replacement: path.resolve('src/client/shared/util/vendor/path-browserify.mjs') },
      { find: /^(node:)?fs$/, replacement: path.resolve('src/client/shared/util/vendor/fs-browser-mock.mjs') },
      { find: 'chalk', replacement: path.resolve('src/client/shared/util/empty.js') },
      { find: 'source-map-js', replacement: path.resolve('src/client/shared/util/source-map-shim.js') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  define: {
    DEVELOPMENT: JSON.stringify(process.env.NODE_ENV !== 'production'),
    VERSION: JSON.stringify('2.0.0'),
    SERVER_API_URL: JSON.stringify(''),
    'process.env.BUILD_TIMESTAMP': JSON.stringify(new Date().toISOString()),
    'process.env.DEBUG_INFO_ENABLED': JSON.stringify(false),
    'process.env.SERVER_API_URL': JSON.stringify(''),
  },
  css: { preprocessorOptions: { scss: { silenceDeprecations: ['slash-div'] } } },
});
