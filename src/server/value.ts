import { operationDate } from './operation-context';
import Decimal from 'decimal.js';
Decimal.set({ precision: 40, toExpNeg: -40, toExpPos: 40, rounding: Decimal.ROUND_HALF_UP });
export { Decimal };
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface Entity extends JsonObject {
  id: number;
  tenantId: number;
}
export class BusinessError extends Error {
  constructor(
    public code: string,
    public status = 400,
    public detail?: string,
  ) {
    super(detail || code);
  }
}
export function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BusinessError('invalidrequest');
  return value as JsonObject;
}
export function list(value: unknown): JsonValue[] {
  if (!Array.isArray(value)) throw new BusinessError('invalidrequest');
  return value;
}
export function text(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') throw new BusinessError('invalidrequest');
  return value;
}
export function integer(value: unknown, positive = false): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || (positive && n <= 0)) throw new BusinessError('invalidquantity');
  return n;
}
export function refId(value: unknown): number {
  return integer(object(value).id, true);
}
export function decimal(value: unknown, fallback?: string): Decimal {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return new Decimal(fallback);
    throw new BusinessError('invalidamount');
  }
  if (typeof value !== 'string' && typeof value !== 'number') throw new BusinessError('invalidamount');
  // JSON number precision is already lost before decimal arithmetic. Only accept safe, ordinary numeric input.
  if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER))
    throw new BusinessError('invalidamount');
  if (typeof value === 'string' && value.length > 100) throw new BusinessError('invalidamount');
  try {
    const d = new Decimal(value);
    if (!d.isFinite() || d.abs().gte('1e38')) throw new Error();
    return d;
  } catch {
    throw new BusinessError('invalidamount');
  }
}
export function money(value: unknown, positive = false): string {
  const d = decimal(value);
  if (d.decimalPlaces() > 2 || (positive && !d.gt(0)) || d.abs().gte('10000000000000000000')) throw new BusinessError('invalidamount');
  return d.toFixed(2);
}
export function quarter(value: Decimal): string {
  return value.times(4).toDecimalPlaces(0).div(4).toFixed(2);
}
export function date(value: unknown, fallback = operationDate().toISOString()): string {
  if (value == null) return fallback;
  const v = text(value);
  const time = Date.parse(v.replace(/\[[^\]]+\]$/, ''));
  if (!Number.isFinite(time)) throw new BusinessError('invaliddate');
  return new Date(time).toISOString();
}
export function flag(value: unknown, fallback = false): boolean {
  if (value == null) return fallback;
  if (typeof value !== 'boolean') throw new BusinessError('invalidrequest');
  return value;
}
export function requireEnum(value: unknown, values: readonly string[]): string {
  const s = text(value);
  if (!values.includes(s)) throw new BusinessError('invalidrequest');
  return s;
}
export function clone<T>(value: T): T {
  return structuredClone(value);
}
export function istanbulDay(value: unknown): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(date(value)),
  );
}
export function dayRange(day: string): [string, string] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new BusinessError('invaliddate');
  const start = date(`${day}T00:00:00+03:00`);
  if (istanbulDay(start) !== day) throw new BusinessError('invaliddate');
  return [start, new Date(Date.parse(start) + 86400000).toISOString()];
}
