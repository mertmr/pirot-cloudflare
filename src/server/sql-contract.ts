export type SqlValue = string | number | ArrayBuffer | null;
export interface SqlCursor<T extends Record<string, SqlValue> = Record<string, SqlValue>> extends Iterable<T> {
  toArray(): T[];
  one(): T;
}
export interface TenantSql {
  exec<T extends Record<string, SqlValue> = Record<string, SqlValue>>(query: string, ...bindings: SqlValue[]): SqlCursor<T>;
  readonly databaseSize: number | null;
}
export interface TransactionRunner {
  transactionSync<T>(callback: () => T): T;
}
