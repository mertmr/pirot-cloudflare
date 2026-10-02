import { mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcryptjs';
import { parse } from 'jsonc-parser';
const directory = process.argv[2];
if (!directory) throw new Error('Usage: bun run staging:prepare-admin /private/output-directory');
const config = parse(readFileSync('wrangler.jsonc', 'utf8'));
const target = config.env.staging;
if (target.d1_databases[0].database_id.startsWith('00000000-')) throw new Error('Provision staging first');
const check = spawnSync(
  'bunx',
  [
    '--no-install',
    'wrangler',
    'd1',
    'execute',
    target.d1_databases[0].database_name,
    '--remote',
    '--env',
    'staging',
    '--command',
    'SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM tenants) AS tenants',
    '--json',
  ],
  { encoding: 'utf8' },
);
if (check.status !== 0) throw new Error('Staging directory inspection failed');
const counts = JSON.parse(check.stdout)[0]?.results?.[0];
if (!counts || counts.users !== 0 || counts.tenants !== 0)
  throw new Error('Initial administrator preparation requires an empty staging directory');
const output = resolve(directory);
mkdirSync(output, { recursive: true, mode: 0o700 });
chmodSync(output, 0o700);
const password = randomBytes(24).toString('base64url');
const hash = await bcrypt.hash(password, 12);
const sql = `INSERT INTO tenants(id,tenant_name) VALUES (1,'Pirot staging cooperative');\nINSERT INTO users(id,login,email,password_hash,activated,tenant_id,authorities) VALUES (1,'staging-admin','staging-admin@example.invalid','${hash}',1,1,'["ROLE_ADMIN","ROLE_USER"]');\n`;
const credentialsPath = join(output, 'staging-admin.json');
const sqlPath = join(output, 'staging-admin.sql');
writeFileSync(credentialsPath, JSON.stringify({ url: target.vars.PUBLIC_URL, login: 'staging-admin', password }, null, 2) + '\n', {
  mode: 0o600,
  flag: 'wx',
});
writeFileSync(sqlPath, sql, { mode: 0o600, flag: 'wx' });
console.log(
  `Prepared private credentials: ${credentialsPath}\nPrepared initial directory SQL: ${sqlPath}\nApply only to ${target.d1_databases[0].database_name} using wrangler d1 execute --remote --env staging --file. No remote data was changed.`,
);
