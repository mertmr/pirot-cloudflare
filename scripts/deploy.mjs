import { parse } from 'jsonc-parser';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const environment = process.argv[2];
if (!['staging', 'production'].includes(environment)) throw new Error('Choose staging or production explicitly');
const config = parse(readFileSync('wrangler.jsonc', 'utf8')),
  target = config.env[environment];
if (
  target.d1_databases.some(d => d.database_id.startsWith('00000000-')) ||
  new URL(target.vars.PUBLIC_URL).hostname.endsWith('.invalid') ||
  (target.vars.EMAIL_ENABLED === 'true' && (!target.vars.EMAIL_FROM || target.vars.EMAIL_FROM.endsWith('.invalid')))
)
  throw new Error('Provision this environment and configure its URL/email before deployment');
const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, CLOUDFLARE_ENV: environment } });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const secrets = spawnSync('bunx', ['--no-install', 'wrangler', 'secret', 'list', '--env', environment], { encoding: 'utf8' });
if (secrets.status !== 0) throw new Error('Cloudflare login or secret listing failed');
if (!secrets.stdout.includes('"AUTH_SECRET"')) throw new Error('Set AUTH_SECRET for this environment before deploying');
run('bun', ['run', 'lint']);
run('bun', ['run', 'typecheck']);
run('bun', ['run', 'test']);
run('bun', ['run', 'format:check']);
run('bun', ['audit', '--audit-level=high']);
run('bun', ['run', 'build']);
const generated = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
if (generated.name !== target.name || generated.d1_databases[0].database_id !== target.d1_databases[0].database_id)
  throw new Error('Built deployment bindings do not match the selected environment');
run('bunx', ['--no-install', 'wrangler', 'deploy', '--env', environment]);
