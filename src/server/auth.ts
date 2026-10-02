import { outboundEmailEnabled, requireOutboundEmail } from './email-policy';
import { SignJWT, jwtVerify } from 'jose';
import { hashPassword, verifyPassword } from './passwords';
import type { Env, CurrentUser } from './env';
import { BusinessError, type JsonObject, object, text, integer, flag, list } from './value';
export interface UserRow {
  id: number;
  login: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  lang_key: string;
  activated: number;
  tenant_id: number | null;
  authorities: string;
  activation_key: string | null;
  reset_key: string | null;
  reset_date: string | null;
  session_version: number;
  created_by: string;
  created_date: string;
  last_modified_by: string | null;
  last_modified_date: string | null;
}
function secret(env: Env): Uint8Array {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) throw new BusinessError('configuration', 503);
  return new TextEncoder().encode(env.AUTH_SECRET);
}
export function publicUser(row: UserRow): JsonObject {
  return {
    id: row.id,
    login: row.login,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    langKey: row.lang_key,
    activated: !!row.activated,
    tenantId: row.tenant_id,
    authorities: JSON.parse(row.authorities),
    createdBy: row.created_by,
    createdDate: row.created_date,
    lastModifiedBy: row.last_modified_by,
    lastModifiedDate: row.last_modified_date,
  };
}
export function principal(row: UserRow): CurrentUser {
  if (!row.tenant_id) throw new BusinessError('tenantrequired', 403);
  return {
    id: row.id,
    login: row.login,
    email: row.email,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    langKey: row.lang_key,
    tenantId: row.tenant_id,
    authorities: JSON.parse(row.authorities),
  };
}
export async function authenticate(request: Request, env: Env): Promise<UserRow> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new BusinessError('unauthorized', 401);
  try {
    const { payload } = await jwtVerify(header.slice(7), secret(env), { algorithms: ['HS256'], issuer: 'pirot', audience: 'pirot-client' });
    const id = integer(payload.sub, true);
    const user = await env.DIRECTORY.prepare('SELECT * FROM users WHERE id=? AND activated=1').bind(id).first<UserRow>();
    if (!user || payload.version !== user.session_version || payload.tenantId !== user.tenant_id)
      throw new BusinessError('unauthorized', 401);
    return user;
  } catch (error) {
    if (error instanceof BusinessError && error.code === 'configuration') throw error;
    throw new BusinessError('unauthorized', 401);
  }
}
export function admin(user: UserRow) {
  if (!JSON.parse(user.authorities).includes('ROLE_ADMIN')) throw new BusinessError('forbidden', 403);
}
function loginValue(value: unknown): string {
  const login = text(value).trim().toLowerCase();
  if (!/^[_.@a-z0-9-]{1,50}$/.test(login)) throw new BusinessError('invalidrequest');
  return login;
}
function emailValue(value: unknown): string {
  const email = text(value).trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BusinessError('invalidrequest');
  return email;
}
function passwordValue(value: unknown): string {
  const password = text(value);
  if (password.length < 8 || password.length > 100 || new TextEncoder().encode(password).length > 72)
    throw new BusinessError('passwordinvalid');
  return password;
}
function authoritiesValue(value: unknown): string {
  const authorities = list(value).map(v => text(v));
  if (!authorities.length || authorities.some(a => !['ROLE_USER', 'ROLE_ADMIN'].includes(a))) throw new BusinessError('invalidrequest');
  return JSON.stringify([...new Set(authorities)]);
}
export async function rateLimit(env: Env, key: string, limit = 10, seconds = 300) {
  const now = Math.floor(Date.now() / 1000),
    window = Math.floor(now / seconds) * seconds;
  const row = await env.DIRECTORY.prepare(
    'INSERT INTO rate_limits(key,count,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window_start=? THEN count+1 ELSE 1 END,window_start=? RETURNING count',
  )
    .bind(key, window, window, window)
    .first<{ count: number }>();
  if (row && row.count > limit) throw new BusinessError('ratelimited', 429);
}
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
async function unique(env: Env, login: string, email: string, id = 0) {
  if (await env.DIRECTORY.prepare('SELECT id FROM users WHERE (login=? OR email=?) AND id<>?').bind(login, email, id).first())
    throw new BusinessError('duplicate', 409);
}
async function tenant(env: Env, id: unknown): Promise<number> {
  const tid = integer(id, true);
  if (!(await env.DIRECTORY.prepare('SELECT id FROM tenants WHERE id=?').bind(tid).first())) throw new BusinessError('notfound', 404);
  return tid;
}
export async function authRoute(request: Request, env: Env, user?: UserRow): Promise<Response | null> {
  const url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  const body = async () => {
    try {
      return object(await request.json());
    } catch {
      throw new BusinessError('invalidrequest');
    }
  };
  if (path === '/api/authenticate') {
    if (method === 'GET') {
      try {
        const authenticated = await authenticate(request, env);
        return new Response(authenticated.login, { headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
      } catch (e) {
        if (e instanceof BusinessError && e.code === 'unauthorized') return new Response('', { headers: { 'cache-control': 'no-store' } });
        throw e;
      }
    }
    if (method !== 'POST') throw new BusinessError('notfound', 404);
    const data = await body();
    const login = loginValue(data.username);
    await rateLimit(env, `login-ip:${request.headers.get('cf-connecting-ip') ?? 'local'}`, 100);
    await rateLimit(env, `login:${login}`, 15);
    const found = await env.DIRECTORY.prepare('SELECT * FROM users WHERE login=?').bind(login).first<UserRow>();
    // A fixed synthetic hash equalizes the expensive verification path for unknown usernames.
    const valid = await verifyPassword(
      env,
      text(data.password),
      found?.password_hash ?? '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    );
    if (!found || !found.activated || !valid) {
      await env.DIRECTORY.prepare('INSERT INTO auth_audit(principal,tenant_id,event_type,event_date) VALUES (?,?,?,?)')
        .bind(login, found?.tenant_id ?? null, 'AUTHENTICATION_FAILURE', new Date().toISOString())
        .run();
      throw new BusinessError('invalidcredentials', 401);
    }
    const token = await new SignJWT({ tenantId: found.tenant_id, version: found.session_version })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(found.id))
      .setIssuer('pirot')
      .setAudience('pirot-client')
      .setIssuedAt()
      .setExpirationTime(flag(data.rememberMe) ? '30d' : '1d')
      .sign(secret(env));
    await env.DIRECTORY.prepare('INSERT INTO auth_audit(principal,tenant_id,event_type,event_date) VALUES (?,?,?,?)')
      .bind(found.login, found.tenant_id, 'AUTHENTICATION_SUCCESS', new Date().toISOString())
      .run();
    return Response.json({ id_token: token }, { headers: { authorization: `Bearer ${token}`, 'cache-control': 'no-store' } });
  }
  if (path === '/api/internal/bootstrap' && method === 'POST') {
    if (env.ENVIRONMENT !== 'development' || !env.BOOTSTRAP_SECRET || request.headers.get('x-bootstrap-secret') !== env.BOOTSTRAP_SECRET)
      throw new BusinessError('notfound', 404);
    if (await env.DIRECTORY.prepare('SELECT id FROM users LIMIT 1').first()) throw new BusinessError('duplicate', 409);
    const data = await body(),
      login = loginValue(data.login),
      email = emailValue(data.email),
      hash = await hashPassword(env, passwordValue(data.password)),
      tid = integer(data.tenantId ?? 1, true),
      name = text(data.tenantName, 'Development cooperative');
    await env.DIRECTORY.batch([
      env.DIRECTORY.prepare('INSERT INTO tenants(id,tenant_name) VALUES (?,?)').bind(tid, name),
      env.DIRECTORY.prepare('INSERT INTO users(login,email,password_hash,activated,tenant_id,authorities) VALUES (?,?,?,1,?,?)').bind(
        login,
        email,
        hash,
        tid,
        '["ROLE_ADMIN","ROLE_USER"]',
      ),
    ]);
    return Response.json({ login, tenantId: tid }, { status: 201 });
  }
  if (path === '/api/activate' && method === 'GET') {
    await rateLimit(env, `activate:${request.headers.get('cf-connecting-ip') ?? 'local'}`, 30);
    const result = await env.DIRECTORY.prepare(
      'UPDATE users SET activated=1,activation_key=NULL,session_version=session_version+1 WHERE activation_key=? AND activated=0 RETURNING id',
    )
      .bind(url.searchParams.get('key') ?? '')
      .first();
    if (!result) throw new BusinessError('notfound', 400);
    return new Response(null, { status: 204 });
  }
  if (path === '/api/account/reset-password/init' && method === 'POST') {
    const email = emailValue(await request.json());
    await rateLimit(env, `reset:${request.headers.get('cf-connecting-ip') ?? 'local'}`, 10);
    requireOutboundEmail(env);
    const found = await env.DIRECTORY.prepare('SELECT * FROM users WHERE email=? AND activated=1').bind(email).first<UserRow>();
    if (found) {
      if (!env.EMAIL_FROM) throw new BusinessError('configuration', 503);
      const key = crypto.randomUUID();
      const link = `${env.PUBLIC_URL}/account/reset/finish?key=${encodeURIComponent(key)}`;
      await env.DIRECTORY.batch([
        env.DIRECTORY.prepare('UPDATE users SET reset_key=?,reset_date=? WHERE id=?').bind(key, new Date().toISOString(), found.id),
        env.DIRECTORY.prepare('INSERT INTO directory_outbox(id,payload,created_at) VALUES (?,?,?)').bind(
          crypto.randomUUID(),
          JSON.stringify({
            type: 'email',
            to: email,
            from: env.EMAIL_FROM,
            subject: found.lang_key === 'tr' ? 'Pirot parola sıfırlama' : 'Pirot password reset',
            html: `<a href="${escapeHtml(link)}">${found.lang_key === 'tr' ? 'Parolayı sıfırla' : 'Reset password'}</a>`,
          }),
          new Date().toISOString(),
        ),
      ]);
    }
    return new Response(null, { status: 204 });
  }
  if (path === '/api/account/reset-password/finish' && method === 'POST') {
    await rateLimit(env, `reset-finish:${request.headers.get('cf-connecting-ip') ?? 'local'}`, 15);
    const data = await body(),
      hash = await hashPassword(env, passwordValue(data.newPassword)),
      cutoff = new Date(Date.now() - 86400000).toISOString();
    const updated = await env.DIRECTORY.prepare(
      'UPDATE users SET password_hash=?,reset_key=NULL,reset_date=NULL,session_version=session_version+1 WHERE reset_key=? AND reset_date>=? AND activated=1 RETURNING id',
    )
      .bind(hash, text(data.key), cutoff)
      .first();
    if (!updated) throw new BusinessError('notfound', 400);
    return new Response(null, { status: 204 });
  }
  if (!user) return null;
  if (path === '/api/account') {
    if (method === 'GET') return Response.json(publicUser(user), { headers: { 'cache-control': 'no-store' } });
    if (method === 'POST') {
      const data = await body(),
        email = emailValue(data.email);
      await unique(env, user.login, email, user.id);
      await env.DIRECTORY.prepare(
        'UPDATE users SET email=?,first_name=?,last_name=?,lang_key=?,last_modified_by=?,last_modified_date=? WHERE id=?',
      )
        .bind(
          email,
          text(data.firstName).slice(0, 50),
          text(data.lastName).slice(0, 50),
          text(data.langKey, 'tr') === 'en' ? 'en' : 'tr',
          user.login,
          new Date().toISOString(),
          user.id,
        )
        .run();
      return new Response(null, { status: 204 });
    }
  }
  if (path === '/api/account/change-password' && method === 'POST') {
    const data = await body();
    if (!(await verifyPassword(env, text(data.currentPassword), user.password_hash))) throw new BusinessError('invalidcredentials');
    const hash = await hashPassword(env, passwordValue(data.newPassword));
    await env.DIRECTORY.prepare('UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?').bind(hash, user.id).run();
    return new Response(null, { status: 204 });
  }
  if (path === '/api/authorities' && method === 'GET') {
    admin(user);
    return Response.json([{ name: 'ROLE_USER' }, { name: 'ROLE_ADMIN' }]);
  }
  if (path === '/api/users' && method === 'GET') {
    if (!user.tenant_id) throw new BusinessError('tenantrequired', 403);
    const rows = await env.DIRECTORY.prepare('SELECT * FROM users WHERE tenant_id=? AND activated=1 ORDER BY login')
      .bind(user.tenant_id)
      .all<UserRow>();
    return Response.json(
      rows.results.map(row => ({
        id: row.id,
        login: row.login,
        firstName: row.first_name,
        lastName: row.last_name,
        tenantId: row.tenant_id,
      })),
      { headers: { 'x-total-count': String(rows.results.length), 'cache-control': 'no-store' } },
    );
  }
  if (path === '/api/tenants' || path.startsWith('/api/tenants/')) {
    admin(user);
    const id = path.split('/')[3];
    if (method === 'GET') {
      if (id) {
        const found = await env.DIRECTORY.prepare('SELECT id,tenant_name AS tenantName FROM tenants WHERE id=?')
          .bind(integer(id, true))
          .first();
        if (!found) throw new BusinessError('notfound', 404);
        return Response.json(found);
      }
      const rows = await env.DIRECTORY.prepare('SELECT id,tenant_name AS tenantName FROM tenants ORDER BY id').all();
      return Response.json(rows.results);
    }
    if (method === 'POST' && !id) {
      const data = await body();
      const name = text(data.tenantName).trim();
      if (!name || name.length > 50) throw new BusinessError('invalidrequest');
      const row = await env.DIRECTORY.prepare('INSERT INTO tenants(tenant_name) VALUES (?) RETURNING id,tenant_name AS tenantName')
        .bind(name)
        .first();
      return Response.json(row, { status: 201 });
    }
    if (method === 'PUT' && id) {
      const name = text((await body()).tenantName).trim();
      if (!name || name.length > 50) throw new BusinessError('invalidrequest');
      const row = await env.DIRECTORY.prepare('UPDATE tenants SET tenant_name=? WHERE id=? RETURNING id,tenant_name AS tenantName')
        .bind(name, integer(id, true))
        .first();
      if (!row) throw new BusinessError('notfound', 404);
      return Response.json(row);
    }
  }
  if (path === '/api/register' || path === '/api/admin/users' || path.startsWith('/api/admin/users/')) {
    admin(user);
    const identifier = path.split('/')[4];
    if (method === 'GET') {
      if (identifier) {
        const found = await env.DIRECTORY.prepare('SELECT * FROM users WHERE login=?').bind(loginValue(identifier)).first<UserRow>();
        if (!found) throw new BusinessError('notfound', 404);
        return Response.json(publicUser(found));
      }
      const page = Math.max(0, integer(url.searchParams.get('page') ?? 0)),
        size = Math.min(1000, integer(url.searchParams.get('size') ?? 20, true));
      const sort = url.searchParams.get('sort') ?? 'id,asc',
        [field, direction] = sort.split(',');
      const columns: Record<string, string> = {
        id: 'id',
        login: 'login',
        email: 'email',
        firstName: 'first_name',
        lastName: 'last_name',
        activated: 'activated',
        createdDate: 'created_date',
        tenantId: 'tenant_id',
      };
      if (!Object.hasOwn(columns, field) || !['asc', 'desc'].includes(direction)) throw new BusinessError('invalidrequest');
      const [rows, count] = await Promise.all([
        env.DIRECTORY.prepare(`SELECT * FROM users ORDER BY ${columns[field]} ${direction.toUpperCase()},id LIMIT ? OFFSET ?`)
          .bind(size, page * size)
          .all<UserRow>(),
        env.DIRECTORY.prepare('SELECT count(*) AS n FROM users').first<{ n: number }>(),
      ]);
      return Response.json(rows.results.map(publicUser), {
        headers: { 'x-total-count': String(count?.n ?? 0), 'cache-control': 'no-store' },
      });
    }
    if (method === 'DELETE' && identifier) {
      const found = await env.DIRECTORY.prepare('SELECT * FROM users WHERE login=?').bind(loginValue(identifier)).first<UserRow>();
      if (!found) throw new BusinessError('notfound', 404);
      if (found.id === user.id) throw new BusinessError('forbidden', 403);
      // Keep historical user references; deactivation immediately invalidates access.
      await env.DIRECTORY.prepare('UPDATE users SET activated=0,session_version=session_version+1 WHERE id=?').bind(found.id).run();
      return new Response(null, { status: 204 });
    }
    if (method === 'POST' || method === 'PUT') {
      const data = await body();
      const login = loginValue(data.login),
        email = emailValue(data.email),
        tid = await tenant(env, data.tenantId ?? (data.tenant ? object(data.tenant).id : null));
      const existing =
        method === 'PUT'
          ? await env.DIRECTORY.prepare('SELECT * FROM users WHERE id=?').bind(integer(data.id, true)).first<UserRow>()
          : null;
      if (method === 'PUT' && !existing) throw new BusinessError('notfound', 404);
      if (identifier && identifier !== existing?.login) throw new BusinessError('invalidrequest');
      if (method === 'POST' && data.id != null) throw new BusinessError('invalidrequest');
      await unique(env, login, email, existing?.id ?? 0);
      const authorities = authoritiesValue(data.authorities ?? ['ROLE_USER']),
        activated = flag(data.activated, path === '/api/register' ? false : true);
      if (existing && existing.tenant_id !== tid) throw new BusinessError('forbidden', 403); // Moving a user requires historical-reference migration, not a directory edit.
      if (existing?.id === user.id && (!activated || !JSON.parse(authorities).includes('ROLE_ADMIN')))
        throw new BusinessError('forbidden', 403);
      if (!existing && !data.password) requireOutboundEmail(env);
      const password = data.password ? passwordValue(data.password) : crypto.randomUUID() + crypto.randomUUID();
      const hash = existing ? existing.password_hash : await hashPassword(env, password),
        activation = activated || !outboundEmailEnabled(env) ? null : crypto.randomUUID();
      let found: UserRow | null;
      if (existing)
        found = await env.DIRECTORY.prepare(
          'UPDATE users SET login=?,email=?,first_name=?,last_name=?,lang_key=?,activated=?,activation_key=NULL,authorities=?,session_version=session_version+1,last_modified_by=?,last_modified_date=? WHERE id=? RETURNING *',
        )
          .bind(
            login,
            email,
            text(data.firstName).slice(0, 50),
            text(data.lastName).slice(0, 50),
            text(data.langKey, 'tr') === 'en' ? 'en' : 'tr',
            activated ? 1 : 0,
            authorities,
            user.login,
            new Date().toISOString(),
            existing.id,
          )
          .first<UserRow>();
      else {
        const reset = !data.password ? crypto.randomUUID() : null;
        if ((reset || activation) && !env.EMAIL_FROM) throw new BusinessError('configuration', 503);
        const now = new Date().toISOString();
        const statements = [
          env.DIRECTORY.prepare(
            'INSERT INTO users(login,email,password_hash,first_name,last_name,lang_key,activated,tenant_id,authorities,activation_key,reset_key,reset_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          ).bind(
            login,
            email,
            hash,
            text(data.firstName).slice(0, 50),
            text(data.lastName).slice(0, 50),
            text(data.langKey, 'tr') === 'en' ? 'en' : 'tr',
            activated ? 1 : 0,
            tid,
            authorities,
            activation,
            reset,
            reset ? now : null,
            user.login,
          ),
        ];
        if (reset)
          statements.push(
            env.DIRECTORY.prepare('INSERT INTO directory_outbox(id,payload,created_at) VALUES (?,?,?)').bind(
              crypto.randomUUID(),
              JSON.stringify({
                type: 'email',
                to: email,
                from: env.EMAIL_FROM,
                subject: 'Pirot',
                html: `<a href="${escapeHtml(env.PUBLIC_URL)}/account/reset/finish?key=${reset}">Set password / Parola belirle</a>`,
              }),
              now,
            ),
          );
        if (activation)
          statements.push(
            env.DIRECTORY.prepare('INSERT INTO directory_outbox(id,payload,created_at) VALUES (?,?,?)').bind(
              crypto.randomUUID(),
              JSON.stringify({
                type: 'email',
                to: email,
                from: env.EMAIL_FROM,
                subject: 'Pirot',
                html: `<a href="${escapeHtml(env.PUBLIC_URL)}/account/activate?key=${activation}">Activate / Etkinleştir</a>`,
              }),
              now,
            ),
          );
        await env.DIRECTORY.batch(statements);
        found = await env.DIRECTORY.prepare('SELECT * FROM users WHERE login=?').bind(login).first<UserRow>();
      }
      if (!found) throw new BusinessError('configuration', 503);
      return Response.json(publicUser(found), { status: existing ? 200 : 201, headers: { 'cache-control': 'no-store' } });
    }
  }
  return null;
}
