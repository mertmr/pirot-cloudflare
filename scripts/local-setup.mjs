import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const vars = '.dev.vars';
if (!existsSync(vars))
  writeFileSync(
    vars,
    `AUTH_SECRET=${randomBytes(48).toString('hex')}\nBOOTSTRAP_SECRET=${randomBytes(32).toString('hex')}\nENVIRONMENT=development\nPUBLIC_URL=http://localhost:9070\nEMAIL_FROM=pirot@example.invalid\n`,
    { mode: 0o600 },
  );
const result = spawnSync('bunx', ['wrangler', 'd1', 'migrations', 'apply', 'pirot-directory', '--local'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('Local D1 initialized. Start bun run dev, then run bun run local:seed. No remote resources were accessed.');
