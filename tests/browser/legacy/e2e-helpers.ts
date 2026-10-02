import { APIRequestContext, Page, expect } from '@playwright/test';

export const ADMIN = { username: 'e2e-admin', password: 'Synthetic-e2e-password-42' } as const;

export type SalePaymentOptions = {
  id?: number;
  card?: boolean;
  deferred?: boolean;
  member?: boolean;
  discount?: number;
};

export interface ProductRecord {
  id: number;
  urunAdi?: string;
  birim?: string;
  stok: string;
  musteriFiyati?: string;
}

export interface SaleRecord {
  id: number;
  toplamTutar?: string;
  odendi?: boolean;
  kartliSatis?: boolean;
  sonraOdeme?: boolean;
  stokHareketleriLists?: Array<{ urun?: { id?: number }; urunId?: number; miktar?: number }>;
}

export interface DebtRecord {
  id: number;
  hareketTipi?: string;
  odemeAraci?: string;
  tutar?: string;
  satis?: number | { id?: number } | null;
}

const sessions = new Map<string, string>();
let adminToken: string;

/** Exercise the real login once per identity, then reuse its signed session. */
export async function login(page: Page, credentials: { username: string; password: string } = ADMIN): Promise<void> {
  const cached = sessions.get(credentials.username);
  if (cached) {
    await page.addInitScript(jwt => sessionStorage.setItem('koop-authenticationToken', JSON.stringify(jwt)), cached);
    await page.goto('/');
    await expect(page.locator('#account-menu')).toBeVisible();
    await expect(page.locator('#login-item')).toHaveCount(0);
    return;
  }
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation')).toBeVisible();

  await page.locator('#account-menu').click();
  await page.locator('#login-item').click();
  await page.waitForURL(/\/login/);

  await expect(page.locator('input[name="username"]')).toBeVisible();
  await page.fill('input[name="username"]', credentials.username);
  await page.fill('input[name="password"]', credentials.password);

  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30_000 });
  await expect(page.locator('#account-menu')).toBeVisible();
  const jwt = await page.evaluate(() => JSON.parse(sessionStorage.getItem('koop-authenticationToken')!));
  sessions.set(credentials.username, jwt);
}

export async function getAdminToken(request: APIRequestContext): Promise<string> {
  if (adminToken) return adminToken;
  const res = await request.post('/api/authenticate', { data: ADMIN });
  expect(res.status(), 'POST /api/authenticate').toBe(200);
  const body: { id_token: string } = await res.json();
  return (adminToken = body.id_token);
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() };
}

/** The checkout screen renders a sticky mobile bar and a desktop actions row; resolve whichever is visible. */
export function posSaveButton(page: Page) {
  return page.locator('#save-entity-desktop:visible, #save-entity:visible');
}

/**
 * Opens the POS editor. The product search autofocuses on load and its listbox
 * overlays the cart and action buttons, so it must be dismissed first.
 */
export async function gotoSaleEditor(page: Page, saleId: number): Promise<void> {
  await page.goto(`/satis/${saleId}/edit`, { waitUntil: 'domcontentloaded' });
  const search = page.locator('.urun-arama input[role="combobox"]');
  await expect(search).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 15_000 });
  await search.press('Escape');
  await expect(page.locator('#satis-urun-sonuclari')).toHaveCount(0);
}

export function uniqueNote(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Mirrors the server's quarter-TL rounding so specs can predict authoritative totals. */
export function roundToQuarter(value: number): number {
  return Math.round(value * 4) / 4;
}

/** Reads the authoritative tenant cash balance (the latest append-only ledger row). */
export async function getCash(request: APIRequestContext, token: string): Promise<number> {
  const res = await request.get('/api/kasa-hareketleris?page=0&size=1&sort=id,desc', { headers: authHeaders(token) });
  expect(res.status(), 'GET /api/kasa-hareketleris').toBe(200);
  const body: Array<{ kasaMiktar: number }> = await res.json();
  return body.length ? Number(body[0].kasaMiktar) : 0;
}

export async function getProduct(request: APIRequestContext, token: string, productId: number): Promise<ProductRecord> {
  const res = await request.get(`/api/uruns/${productId}`, { headers: authHeaders(token) });
  expect(res.status(), `GET /api/uruns/${productId}`).toBe(200);
  return res.json();
}

export async function getStock(request: APIRequestContext, token: string, productId: number): Promise<number> {
  const product = await getProduct(request, token, productId);
  return Number(product.stok);
}

export async function getSale(request: APIRequestContext, token: string, saleId: number): Promise<SaleRecord> {
  const res = await request.get(`/api/satis/${saleId}`, { headers: authHeaders(token) });
  expect(res.status(), `GET /api/satis/${saleId}`).toBe(200);
  return res.json();
}

export function salePayload(productId: number, quantity: number, opts: SalePaymentOptions = {}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    tarih: new Date().toISOString(),
    stokHareketleriLists: [{ urunId: productId, miktar: quantity }],
    ortagaSatis: !!opts.member,
    kartliSatis: !!opts.card,
    sonraOdeme: !!opts.deferred,
  };
  if (opts.id) {
    payload.id = opts.id;
  }
  if (opts.discount) {
    payload.indirim = opts.discount;
  }
  return payload;
}

export async function createSale(
  request: APIRequestContext,
  token: string,
  productId: number,
  quantity: number,
  opts: SalePaymentOptions = {},
): Promise<SaleRecord> {
  const res = await request.post('/api/satis', { headers: authHeaders(token), data: salePayload(productId, quantity, opts) });
  expect(res.status(), 'POST /api/satis').toBe(201);
  return res.json();
}

async function entityExists(request: APIRequestContext, token: string, apiPath: string, id: number): Promise<boolean> {
  const res = await request.get(`${apiPath}/${id}`, { headers: authHeaders(token) });
  expect([200, 404], `GET ${apiPath}/${id}`).toContain(res.status());
  return res.status() === 200;
}

/**
 * Best-effort cleanup: skips entities already removed through the UI. The
 * existence check keeps the helper from masking an original assertion failure
 * with a delete error.
 */
export async function deleteSaleIfExists(request: APIRequestContext, token: string, saleId: number): Promise<void> {
  if (!(await entityExists(request, token, '/api/satis', saleId))) {
    return;
  }
  const res = await request.delete(`/api/satis/${saleId}`, { headers: authHeaders(token) });
  expect(res.status(), `DELETE /api/satis/${saleId}`).toBe(204);
}

export async function getDebtsForSale(request: APIRequestContext, token: string, saleId: number): Promise<DebtRecord[]> {
  const res = await request.get('/api/borc-alacaks?page=0&size=200&sort=id,desc', { headers: authHeaders(token) });
  expect(res.status(), 'GET /api/borc-alacaks').toBe(200);
  const body: DebtRecord[] = await res.json();
  return body.filter(debt => {
    const satisId = debt.satis && typeof debt.satis === 'object' ? debt.satis.id : debt.satis;
    return satisId === saleId;
  });
}

export async function listEntities<T>(request: APIRequestContext, token: string, apiPath: string): Promise<T[]> {
  const res = await request.get(`${apiPath}?page=0&size=200&sort=id,desc`, { headers: authHeaders(token) });
  expect(res.status(), `GET ${apiPath}`).toBe(200);
  return res.json();
}

export async function findEntityByField<T extends object>(
  request: APIRequestContext,
  token: string,
  apiPath: string,
  field: string,
  value: string,
): Promise<T> {
  const entities = await listEntities<T>(request, token, apiPath);
  const match = entities.find(entity => String((entity as Record<string, unknown>)[field] ?? '') === value);
  expect(match, `Expected ${apiPath} to contain ${field}="${value}"`).toBeTruthy();
  return match as T;
}

/** Best-effort cleanup for CRUD specs; skips entities already removed through the UI. */
export async function deleteEntityIfExists(
  request: APIRequestContext,
  token: string,
  apiPath: string,
  id: number | undefined,
): Promise<void> {
  if (!id || !(await entityExists(request, token, apiPath, id))) {
    return;
  }
  const res = await request.delete(`${apiPath}/${id}`, { headers: authHeaders(token) });
  expect(res.status(), `DELETE ${apiPath}/${id}`).toBe(204);
}
