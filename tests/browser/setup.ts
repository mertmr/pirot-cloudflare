import { spawnSync } from 'node:child_process';
export default function setup() {
  const result = spawnSync('node', ['scripts/local-seed.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, PIROT_LOCAL_URL: 'http://127.0.0.1:9070' },
  });
  if (result.status !== 0) throw new Error('Synthetic local browser fixture setup failed');
}
