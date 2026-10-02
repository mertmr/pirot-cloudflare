import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.output/**',
      'dist/**',
      '.test-output/**',
      'playwright-report/**',
      'test-results/**',
      '.wrangler/**',
      'src/routeTree.gen.ts',
      'src/client/**/*.spec.*',
      'src/client/shared/util/vendor/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, DEVELOPMENT: 'readonly', VERSION: 'readonly', SERVER_API_URL: 'readonly' },
    },
  },
  {
    files: ['src/client/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/server/**/*.ts', 'tests/**/*.ts', 'scripts/**/*.ts'],
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
);
