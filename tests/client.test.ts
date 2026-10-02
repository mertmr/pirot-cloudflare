// @vitest-environment happy-dom
import { test, expect, vi } from 'vitest';
import { Window } from 'happy-dom';
import axios, { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import setupInterceptors from '../src/client/config/axios-interceptor';
import reducer, { createEntity, updateEntity, reset } from '../src/client/entities/satis/satis.reducer';
import type { ISatis, ISatisRequest } from '../src/client/shared/model/satis.model';
import { formatDecimal } from '../src/client/shared/util/decimal-format';
test('formats decimal strings exactly without losing cents above 2^53', () => {
  expect(formatDecimal('9007199254740993.25', 2, 'en-US')).toBe('9,007,199,254,740,993.25');
  expect(formatDecimal('-0.25', 2, 'tr-TR')).toBe('-0,25');
});
test('request interceptor preserves an explicit retry key regardless of header casing and attaches authoritative session credentials', async () => {
  const original = axios.defaults.adapter,
    captured: InternalAxiosRequestConfig[] = [];
  axios.defaults.adapter = async config => {
    captured.push(config);
    return { data: {}, status: 200, statusText: 'OK', config, headers: new AxiosHeaders() };
  };
  const browser = new Window({ url: 'https://fixture.test' });
  vi.stubGlobal('window', browser);
  browser.sessionStorage.setItem('koop-authenticationToken', JSON.stringify('synthetic-session-token'));
  browser.sessionStorage.setItem('locale', JSON.stringify('en'));
  const unauthenticated = vi.fn();
  setupInterceptors(unauthenticated);
  try {
    await axios.post('/api/satis', {}, { headers: { 'idempotency-key': 'stable-fixture-key' } });
    await axios.post('/api/satis', {});
    await axios.get('/api/satis');
    expect(captured[0].headers.get('idempotency-key')).toBe('stable-fixture-key');
    expect(captured[0].headers.get('authorization')).toBe('Bearer synthetic-session-token');
    expect(captured[0].headers.get('accept-language')).toBe('en');
    expect(captured[1].headers.get('idempotency-key')).toMatch(/^[a-f0-9-]{36}$/);
    expect(captured[2].headers.has('idempotency-key')).toBe(false);
  } finally {
    axios.interceptors.request.clear();
    axios.interceptors.response.clear();
    axios.defaults.adapter = original;
    browser.sessionStorage.clear();
    vi.unstubAllGlobals();
  }
});
test('failed financial save retains the loaded entity, exposes failure, and clears pending state', () => {
  const request: ISatisRequest = { id: 12, stokHareketleriLists: [{ urunId: 1, miktar: 2 }] };
  const response: AxiosResponse<ISatis> = {
    data: { id: 12, toplamTutar: '9007199254740993.25' },
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  const loaded = reducer(undefined, createEntity.fulfilled(response, 'fixture', request));
  expect(loaded.entity.toplamTutar).toBe('9007199254740993.25');
  const pending = reducer(loaded, updateEntity.pending('fixture', request));
  expect(pending.updating).toBe(true);
  expect(pending.updateSuccess).toBe(false);
  const failed = reducer(pending, updateEntity.rejected(new Error('Insufficient stock'), 'fixture', request));
  expect(failed.updating).toBe(false);
  expect(failed.entity).toEqual(loaded.entity);
  expect(failed.errorMessage).toBe('Insufficient stock');
  expect(failed.updateSuccess).toBe(false);
  expect(reducer(failed, reset()).entity.id).toBeUndefined();
});

test('checkout preserves exact large prices, gram arithmetic and quarter rounding', async () => {
  const { calculateSaleLine, quarterMoney, SaleDecimal } = await import('../src/client/entities/satis/satis-totals');
  expect(calculateSaleLine({ musteriFiyati: '9007199254740993.25', birim: 'ADET' }, 1)).toBe('9007199254740993.25');
  expect(calculateSaleLine({ musteriFiyati: '12.50', birim: 'GRAM' }, 100)).toBe('1.25');
  expect(calculateSaleLine({ musteriFiyati: '1.125', birim: 'ADET' }, 1)).toBe('1.25');
  expect(quarterMoney(new SaleDecimal('100.25').times(new SaleDecimal(100).minus('10')).div(100))).toBe('90.25');
});
