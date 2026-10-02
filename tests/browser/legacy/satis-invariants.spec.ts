import { APIRequestContext, expect, test } from '@playwright/test';
import { getAdminToken, type DebtRecord, type SaleRecord } from './e2e-helpers';

// Serial: the spec mutates cash/stock/debt and must not overlap with itself.
test.describe.configure({ mode: 'serial' });

// Uses Organik Elma (seeded: 150 ADET @ 45.50 TL), not the product used by the
// UI create test (Yumurta), so stock deltas never collide across specs.
const PRODUCT_ID = 1;

let token: string;

test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
});

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() };
}

async function getCash(request: APIRequestContext): Promise<number> {
  const res = await request.get('/api/kasa-hareketleris?page=0&size=1&sort=tarih,desc', { headers: authHeaders() });
  expect(res.status()).toBe(200);
  const body: Array<{ kasaMiktar: number }> = await res.json();
  return body.length ? Number(body[0].kasaMiktar) : 0;
}

async function getStock(request: APIRequestContext, productId: number): Promise<number> {
  const res = await request.get(`/api/uruns/${productId}`, { headers: authHeaders() });
  expect(res.status()).toBe(200);
  const body: { stok: number } = await res.json();
  return Number(body.stok);
}

async function getBorcForSale(request: APIRequestContext, saleId: number): Promise<DebtRecord[]> {
  const res = await request.get('/api/borc-alacaks?page=0&size=200&sort=tarih,desc', { headers: authHeaders() });
  expect(res.status()).toBe(200);
  const body: DebtRecord[] = await res.json();
  return (body || []).filter(b => {
    const satis = b.satis;
    return satis && (typeof satis === 'object' ? satis.id === saleId : satis === saleId);
  });
}

function salePayload(
  productId: number,
  quantity: number,
  opts: { id?: number; card?: boolean; deferred?: boolean } = {},
): Record<string, unknown> {
  const payload = {
    tarih: new Date().toISOString(),
    stokHareketleriLists: [{ urunId: productId, miktar: quantity }],
    ortagaSatis: false,
    kartliSatis: !!opts.card,
    sonraOdeme: !!opts.deferred,
  };
  if (opts.id) {
    (payload as Record<string, unknown>).id = opts.id;
  }
  return payload;
}

test('cash sale: kasa += server total, stock -= qty; update reconciles; delete restores', async ({ request }) => {
  const cash0 = await getCash(request);
  const stock0 = await getStock(request, PRODUCT_ID);
  let saleId: number | undefined;

  try {
    // create 1 x Elma -> server validates price and rounds to the sale total
    let res = await request.post('/api/satis', { headers: authHeaders(), data: salePayload(PRODUCT_ID, 1) });
    expect(res.status()).toBe(201);
    let sale: SaleRecord = await res.json();
    saleId = sale.id;
    const total1 = Number(sale.toplamTutar);
    expect(await getCash(request)).toBeCloseTo(cash0 + total1, 2);
    expect(await getStock(request, PRODUCT_ID)).toBe(stock0 - 1);

    // update to 3 -> total grows, stock and kasa follow the new authoritative total
    res = await request.put('/api/satis', {
      headers: authHeaders(),
      data: salePayload(PRODUCT_ID, 3, { id: saleId }),
    });
    expect(res.status()).toBe(200);
    sale = await res.json();
    const total2 = Number(sale.toplamTutar);
    expect(sale.stokHareketleriLists).toHaveLength(1);
    expect(await getCash(request)).toBeCloseTo(cash0 + total2, 2);
    expect(await getStock(request, PRODUCT_ID)).toBe(stock0 - 3);
  } finally {
    if (saleId) {
      const del = await request.delete(`/api/satis/${saleId}`, { headers: authHeaders() });
      expect(del.status()).toBe(204);
    }
  }
  expect(await getCash(request)).toBeCloseTo(cash0, 2);
  expect(await getStock(request, PRODUCT_ID)).toBe(stock0);
});

test('card sale: stock -= qty but kasa is never mutated; delete restores both', async ({ request }) => {
  const cash0 = await getCash(request);
  const stock0 = await getStock(request, PRODUCT_ID);
  let saleId: number | undefined;

  try {
    const res = await request.post('/api/satis', { headers: authHeaders(), data: salePayload(PRODUCT_ID, 2, { card: true }) });
    expect(res.status()).toBe(201);
    saleId = (await res.json()).id;
    expect(await getCash(request)).toBeCloseTo(cash0, 2);
    expect(await getStock(request, PRODUCT_ID)).toBe(stock0 - 2);
  } finally {
    if (saleId) {
      await request.delete(`/api/satis/${saleId}`, { headers: authHeaders() });
    }
  }
  expect(await getCash(request)).toBeCloseTo(cash0, 2);
  expect(await getStock(request, PRODUCT_ID)).toBe(stock0);
});

test('deferred sale: creates BORC debt, kasa untouched; BANKA collection never credits kasa; delete cleans up', async ({ request }) => {
  const cash0 = await getCash(request);
  const stock0 = await getStock(request, PRODUCT_ID);
  let saleId: number | undefined;

  try {
    const res = await request.post('/api/satis', {
      headers: authHeaders(),
      data: salePayload(PRODUCT_ID, 2, { deferred: true }),
    });
    expect(res.status()).toBe(201);
    const sale: SaleRecord = await res.json();
    saleId = sale.id;
    expect(sale.odendi).toBe(false);
    expect(sale.kartliSatis).toBe(false);
    expect(await getCash(request)).toBeCloseTo(cash0, 2);
    expect(await getStock(request, PRODUCT_ID)).toBe(stock0 - 2);

    const debts = await getBorcForSale(request, saleId);
    expect(debts).toHaveLength(1);
    expect(debts[0].hareketTipi).toBe('BORC');
    expect(debts[0].odemeAraci).toBe('SONRA_ODEME');

    // Bank collection: marks paid, switches debt to ODEME/BANKA, cash stays flat
    const collect = await request.post(`/api/satis/${saleId}/collect-payment?paymentMethod=BANKA`, {
      headers: authHeaders(),
    });
    expect(collect.status()).toBe(200);
    const collected = await collect.json();
    expect(collected.odendi).toBe(true);
    expect(collected.kartliSatis).toBe(true);
    expect(await getCash(request)).toBeCloseTo(cash0, 2);

    const collectedDebt = await getBorcForSale(request, saleId);
    expect(collectedDebt).toHaveLength(1);
    expect(collectedDebt[0].hareketTipi).toBe('ODEME');
    expect(collectedDebt[0].odemeAraci).toBe('BANKA');
  } finally {
    if (saleId) {
      await request.delete(`/api/satis/${saleId}`, { headers: authHeaders() });
    }
  }
  expect(await getCash(request)).toBeCloseTo(cash0, 2);
  expect(await getStock(request, PRODUCT_ID)).toBe(stock0);
  expect(await getBorcForSale(request, saleId!)).toHaveLength(0);
});

test('deferred cash collection credits kasa exactly once and rejects double payment', async ({ request }) => {
  const cash0 = await getCash(request);
  const stock0 = await getStock(request, PRODUCT_ID);
  let saleId: number | undefined;

  try {
    const create = await request.post('/api/satis', {
      headers: authHeaders(),
      data: salePayload(PRODUCT_ID, 1, { deferred: true }),
    });
    expect(create.status()).toBe(201);
    const sale: SaleRecord = await create.json();
    saleId = sale.id;
    const total = Number(sale.toplamTutar);
    expect(await getCash(request)).toBeCloseTo(cash0, 2);

    const collect = await request.post(`/api/satis/${saleId}/collect-payment?paymentMethod=NAKIT`, {
      headers: authHeaders(),
    });
    expect(collect.status()).toBe(200);
    expect((await collect.json()).odendi).toBe(true);
    expect(await getCash(request)).toBeCloseTo(cash0 + total, 2);
    expect(await getStock(request, PRODUCT_ID)).toBe(stock0 - 1);

    // A second collection must be rejected (fixed-once invariant)
    const double = await request.post(`/api/satis/${saleId}/collect-payment?paymentMethod=NAKIT`, {
      headers: authHeaders(),
    });
    expect(double.status()).toBeGreaterThanOrEqual(400);
    expect(await getCash(request)).toBeCloseTo(cash0 + total, 2);
  } finally {
    if (saleId) {
      await request.delete(`/api/satis/${saleId}`, { headers: authHeaders() });
    }
  }
  // deleting a collected-nakit deferred sale reverses the credit
  expect(await getCash(request)).toBeCloseTo(cash0, 2);
  expect(await getStock(request, PRODUCT_ID)).toBe(stock0);
});

test('overselling stock is rejected with zero mutation', async ({ request }) => {
  const cash0 = await getCash(request);
  const stock0 = await getStock(request, PRODUCT_ID);

  const res = await request.post('/api/satis', {
    headers: authHeaders(),
    data: salePayload(PRODUCT_ID, stock0 + 1),
  });
  expect(res.status()).toBe(409);
  expect((await res.json()).errorKey).toBe('insufficientstock');

  expect(await getCash(request)).toBeCloseTo(cash0, 2);
  expect(await getStock(request, PRODUCT_ID)).toBe(stock0);
});

test('deferred + card payment together is rejected', async ({ request }) => {
  const cash0 = await getCash(request);
  const stock0 = await getStock(request, PRODUCT_ID);

  const res = await request.post('/api/satis', {
    headers: authHeaders(),
    data: salePayload(PRODUCT_ID, 1, { card: true, deferred: true }),
  });
  expect(res.status()).toBe(400);

  expect(await getCash(request)).toBeCloseTo(cash0, 2);
  expect(await getStock(request, PRODUCT_ID)).toBe(stock0);
});
