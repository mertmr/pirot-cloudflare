import { parse } from 'jsonc-parser';
import { format } from 'prettier';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const [environment, publicUrl, emailFrom] = process.argv.slice(2);
if (!['staging', 'production'].includes(environment) || !publicUrl)
  throw new Error('Usage: bun run provision staging https://staging.your-domain.example [pirot@your-verified-domain.example]');
const url = new URL(publicUrl);
if (
  url.protocol !== 'https:' ||
  url.hostname.endsWith('.invalid') ||
  (emailFrom && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFrom) || emailFrom.endsWith('.invalid')))
)
  throw new Error('Supply a real HTTPS application URL; an optional email sender must use a verified domain.');
const command = args => {
  const result = spawnSync('bunx', ['--no-install', 'wrangler', ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `Wrangler ${args[0]} failed`);
  return result.stdout;
};
command(['whoami']);
const config = parse(readFileSync('wrangler.jsonc', 'utf8')),
  target = config.env[environment];
const database = target.d1_databases[0],
  queue = target.queues.producers[0].queue;
let databases = JSON.parse(command(['d1', 'list', '--json']));
if (!databases.some(d => d.name === database.database_name)) {
  command(['d1', 'create', database.database_name]);
  databases = JSON.parse(command(['d1', 'list', '--json']));
}
const found = databases.find(d => d.name === database.database_name);
if (!found?.uuid) throw new Error('Created database UUID unavailable');
database.database_id = found.uuid;
const queues = command(['queues', 'list']);
for (const name of [queue, queue + '-dlq']) if (!queues.split(/[^\w-]+/).includes(name)) command(['queues', 'create', name]);
target.vars.PUBLIC_URL = url.origin;
if (emailFrom) target.vars.EMAIL_FROM = emailFrom;
if (target.vars.EMAIL_ENABLED === 'true' && !emailFrom) throw new Error('Email-enabled environments require a verified sender argument');
if (target.vars.EMAIL_ENABLED === 'true') target.send_email = [{ name: 'EMAIL', allowed_sender_addresses: [emailFrom] }];
else delete target.send_email;
writeFileSync(
  'wrangler.jsonc',
  await format(JSON.stringify(config), { ...JSON.parse(readFileSync('.prettierrc.json', 'utf8')), filepath: 'wrangler.jsonc' }),
);
command(['d1', 'migrations', 'apply', database.database_name, '--remote', '--env', environment]);
console.log(
  `Provisioned ${environment} D1, Queues and bindings. Set AUTH_SECRET with wrangler secret put AUTH_SECRET --env ${environment}.`,
);
