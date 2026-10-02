import { ENTITY_TABLES, TABLES, type TableSpec } from './d1-schema';
import type { EntityKind } from './entity-specs';
import type { SqlCursor, SqlValue, TenantSql } from './sql-contract';
import { BusinessError } from './value';
import { operationContext, operationId, replayOperation } from './operation-context';

type Row = Record<string, SqlValue>;
interface Change {
  row: Row;
  removed: boolean;
}
interface Query {
  sql: string;
  bindings: SqlValue[];
}
export class ReadRequired extends Error {
  constructor(
    readonly key: string,
    readonly query: Query,
  ) {
    super('D1 read required');
  }
}
function cursor<T extends Row>(rows: T[]): SqlCursor<T> {
  return {
    toArray: () => rows,
    one: () => {
      if (rows.length !== 1) throw new Error('Expected exactly one SQL row');
      return rows[0];
    },
    [Symbol.iterator]: () => rows[Symbol.iterator](),
  };
}
function split(input: string): string[] {
  const result: string[] = [];
  let start = 0,
    depth = 0,
    quoted = false;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "'") {
      if (quoted && input[i + 1] === "'") {
        i++;
        continue;
      }
      quoted = !quoted;
    }
    if (!quoted) {
      if (input[i] === '(') depth++;
      if (input[i] === ')') depth--;
      if (input[i] === ',' && depth === 0) {
        result.push(input.slice(start, i).trim());
        start = i + 1;
      }
    }
  }
  result.push(input.slice(start).trim());
  return result;
}
// The existing services remain synchronous. Reads suspend planning and are replayed
// against D1; writes are buffered until validation succeeds and the revision matches.
export class D1TenantSql implements TenantSql {
  readonly databaseSize = null;
  readonly changes = new Map<string, Map<string, Change>>();
  readonly writes: Query[] = [];
  constructor(
    readonly tenantId: number,
    readonly cache: Map<string, Row[]>,
  ) {
    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) throw new BusinessError('tenantrequired', 403);
  }
  private spec(table: string): TableSpec {
    const spec = TABLES[table];
    if (!spec) throw new Error(`Unsupported tenant table: ${table}`);
    return spec;
  }
  private key(table: string, row: Row): string {
    return JSON.stringify(this.spec(table).keys.map(k => row[k]));
  }
  private scoped(sql: string, bindings: SqlValue[]): Query {
    const tokens = sql.replace(/'(?:''|[^'])*'/g, "''");
    const ctes: string[] = [],
      params: SqlValue[] = [];
    for (const [table, spec] of Object.entries(TABLES)) {
      if (!new RegExp(`\\b${table}\\b`, 'i').test(tokens)) continue;
      const occurrences = [...tokens.matchAll(new RegExp(`\\b${table}\\b`, 'gi'))].length;
      const selectedKind =
        table === 'entities' &&
        occurrences === 1 &&
        /WHERE (?:\w+\.)?kind=\?/i.test(tokens) &&
        typeof bindings[0] === 'string' &&
        Object.hasOwn(ENTITY_TABLES, bindings[0])
          ? (bindings[0] as EntityKind)
          : null;
      const delta = [...(this.changes.get(table)?.values() ?? [])].filter(change => !selectedKind || change.row.kind === selectedKind);
      const base = selectedKind
        ? `SELECT '${selectedKind}' AS kind,id,data FROM ${ENTITY_TABLES[selectedKind]} WHERE tenant_id=${this.tenantId}`
        : `SELECT ${spec.columns.join(',')} FROM ${spec.physical} WHERE tenant_id=${this.tenantId}`;
      const materialized = table === 'entities' && occurrences > 1 ? 'MATERIALIZED ' : '';

      if (!delta.length) {
        ctes.push(`${table} AS ${materialized}(${base})`);
        continue;
      }
      const name = `delta_${table}`;
      const chunks: string[] = [];
      let chunk: Change[] = [],
        bytes = 0;
      for (const change of delta) {
        const size = JSON.stringify(change).length;
        if (bytes + size > 500000 && chunk.length) {
          params.push(JSON.stringify(chunk));
          chunks.push('SELECT value FROM json_each(?)');
          chunk = [];
          bytes = 0;
        }
        chunk.push(change);
        bytes += size;
      }
      if (chunk.length) {
        params.push(JSON.stringify(chunk));
        chunks.push('SELECT value FROM json_each(?)');
      }
      ctes.push(`${name} AS MATERIALIZED (${chunks.join(' UNION ALL ')})`);
      ctes.push(
        `${table} AS ${materialized}(SELECT ${spec.columns.map(c => `b.${c}`).join(',')} FROM (${base}) b WHERE NOT EXISTS (SELECT 1 FROM ${name} d WHERE ${spec.keys.map(k => `b.${k}=json_extract(d.value,'$.row.${k}')`).join(' AND ')}) UNION ALL SELECT ${spec.columns.map(c => `json_extract(value,'$.row.${c}') AS ${c}`).join(',')} FROM ${name} WHERE json_extract(value,'$.removed')=0)`,
      );
    }
    return { sql: `${ctes.length ? `WITH ${ctes.join(',')} ` : ''}${sql}`, bindings: [...params, ...bindings] };
  }
  private read(sql: string, bindings: SqlValue[]): Row[] {
    const simple = /^SELECT ([\w,]+) FROM (\w+) WHERE ([\w=?' :.-]+)$/i.exec(sql);
    if (simple && TABLES[simple[2]]) {
      const spec = this.spec(simple[2]),
        clauses = simple[3].split(/ AND /i),
        keyRow: Row = {};
      let offset = 0;
      let valid = clauses.length === spec.keys.length;
      for (const clause of clauses) {
        const match = /^(\w+)=(\?|'[^']*')$/.exec(clause);
        if (!match || !spec.keys.includes(match[1])) {
          valid = false;
          break;
        }
        keyRow[match[1]] = match[2] === '?' ? bindings[offset++] : match[2].slice(1, -1);
      }
      if (valid) {
        const changed = this.changes.get(simple[2])?.get(this.key(simple[2], keyRow));
        if (changed) return changed.removed ? [] : [Object.fromEntries(simple[1].split(',').map(c => [c, changed.row[c] ?? null]))];
      }
    }
    const query = this.scoped(sql, bindings),
      key = JSON.stringify(query);
    const rows = this.cache.get(key);
    if (!rows) throw new ReadRequired(key, query);
    return rows;
  }
  private writeRow(table: string, row: Row, removed = false) {
    const spec = this.spec(table),
      key = this.key(table, row);
    if (!this.changes.has(table)) this.changes.set(table, new Map());
    this.changes.get(table)!.set(key, { row, removed });
    let physical = spec.physical,
      columns = spec.columns,
      keys = spec.keys;
    if (table === 'entities') {
      physical = ENTITY_TABLES[row.kind as EntityKind];
      if (!physical) throw new BusinessError('invalidrequest');
      columns = ['id', 'data'];
      keys = ['id'];
    }
    if (removed)
      this.writes.push({
        sql: `DELETE FROM ${physical} WHERE tenant_id=? AND ${keys.map(k => `${k}=?`).join(' AND ')}`,
        bindings: [this.tenantId, ...keys.map(k => row[k])],
      });
    else
      this.writes.push({
        sql: `INSERT INTO ${physical}(tenant_id,${columns.join(',')}) VALUES (${['tenant_id', ...columns].map(() => '?').join(',')}) ON CONFLICT(tenant_id,${keys.join(',')}) DO UPDATE SET ${columns
          .filter(c => !keys.includes(c))
          .map(c => `${c}=excluded.${c}`)
          .join(',')}`,
        bindings: [this.tenantId, ...columns.map(c => row[c] ?? null)],
      });
  }
  exec<T extends Row = Row>(query: string, ...bindings: SqlValue[]): SqlCursor<T> {
    const sql = query.trim().replace(/;$/, '');
    if (/^CREATE\s/i.test(sql)) return cursor([] as T[]);
    if (/^PRAGMA table_info\(outbox\)$/i.test(sql)) return cursor(TABLES.outbox.columns.map(name => ({ name })) as unknown as T[]);
    if (/^SELECT\s/i.test(sql)) return cursor(this.read(sql, bindings) as T[]);
    if (sql.includes(';')) {
      if (bindings.length) throw new Error('Bindings with multiple statements unsupported');
      for (const statement of sql.split(';')) if (statement.trim()) this.exec(statement);
      return cursor([] as T[]);
    }
    const insert = /^INSERT INTO (\w+)\(([^)]+)\)\s+VALUES\s*\(/i.exec(sql);
    if (insert) {
      const table = insert[1],
        spec = this.spec(table),
        columns = split(insert[2]);
      let end = insert[0].length,
        depth = 1,
        quoted = false;
      for (; end < sql.length; end++) {
        const c = sql[end];
        if (c === "'") {
          if (quoted && sql[end + 1] === "'") {
            end++;
            continue;
          }
          quoted = !quoted;
        }
        if (!quoted && c === '(') depth++;
        if (!quoted && c === ')' && --depth === 0) break;
      }
      let index = 0;
      const value = (expression: string): SqlValue => {
        if (expression === '?') return bindings[index++];
        if (/^null$/i.test(expression)) return null;
        if (/^-?\d+(?:\.\d+)?$/.test(expression)) return Number(expression);
        if (/^'(?:''|[^'])*'$/.test(expression)) return expression.slice(1, -1).replace(/''/g, "'");
        throw new Error(`Unsupported SQL value: ${expression}`);
      };
      const expressions = split(sql.slice(insert[0].length, end));
      const row: Row = Object.fromEntries(columns.map((c, i) => [c, value(expressions[i])]));
      if (table === 'history' && row.id === undefined)
        row.id = Number(this.read('SELECT coalesce(max(id),0) AS id FROM history', [])[0].id) + 1;
      const tail = sql.slice(end + 1);
      if (/ON CONFLICT/i.test(tail)) {
        const old = this.read(
          `SELECT ${spec.columns.join(',')} FROM ${table} WHERE ${spec.keys.map(k => `${k}=?`).join(' AND ')}`,
          spec.keys.map(k => row[k]),
        )[0];
        if (old) {
          const updated = { ...old };
          const assignments = /DO UPDATE SET ([\s\S]+?)(?: RETURNING\s|$)/i.exec(tail)?.[1];
          if (!assignments) throw new Error('Unsupported upsert');
          for (const assignment of split(assignments)) {
            const [field, expression] = assignment.split('=');
            const rhs = expression.trim();
            if (/^excluded\.\w+$/.test(rhs)) updated[field.trim()] = row[rhs.slice(9)];
            else if (rhs === 'value+1') updated[field.trim()] = Number(old.value) + 1;
            else if (rhs === 'max(value,excluded.value)') updated[field.trim()] = Math.max(Number(old.value), Number(row.value));
            else throw new Error(`Unsupported upsert expression: ${rhs}`);
          }
          Object.assign(row, updated);
          if (spec.columns.every(c => (row[c] ?? null) === (old[c] ?? null))) {
            const returning = /RETURNING\s+(\w+)$/i.exec(tail);
            return cursor((returning ? [{ [returning[1]]: row[returning[1]] }] : []) as T[]);
          }
        }
      }
      this.writeRow(table, row);
      const returning = /RETURNING\s+(\w+)$/i.exec(tail);
      return cursor((returning ? [{ [returning[1]]: row[returning[1]] }] : []) as T[]);
    }
    const copy = /^INSERT INTO (backup_records)\(([^)]+)\)\s+(SELECT[\s\S]+)$/i.exec(sql);
    if (copy) {
      const scoped = this.scoped(copy[3], bindings);
      const projection = scoped.sql.replace(/SELECT (?=[\s\S]*$)/, 'SELECT ');
      // INSERT ... WITH ... SELECT keeps the frozen snapshot inside the same D1 batch.
      this.writes.push({
        sql: `INSERT INTO business_backup_records(tenant_id,${copy[2]}) SELECT ${this.tenantId},copied.* FROM (${projection}) copied`,
        bindings: scoped.bindings,
      });
      return cursor([] as T[]);
    }
    const update = /^UPDATE (\w+) SET (.+?) WHERE (.+)$/i.exec(sql);
    if (update) {
      const assignments = split(update[2]);
      const values = bindings.slice(0, assignments.length);
      const rows = this.read(
        `SELECT ${this.spec(update[1]).columns.join(',')} FROM ${update[1]} WHERE ${update[3]}`,
        bindings.slice(assignments.length),
      );
      for (const old of rows) {
        const row = { ...old };
        assignments.forEach((a, i) => {
          if (!/^\w+=\?$/.test(a.trim())) throw new Error('Unsupported update');
          row[a.split('=')[0].trim()] = values[i];
        });
        this.writeRow(update[1], row);
      }
      return cursor([] as T[]);
    }
    const remove = /^DELETE FROM (\w+)(?: WHERE ([\s\S]+))?$/i.exec(sql);
    if (remove) {
      for (const row of this.read(
        `SELECT ${this.spec(remove[1]).columns.join(',')} FROM ${remove[1]}${remove[2] ? ` WHERE ${remove[2]}` : ''}`,
        bindings,
      ))
        this.writeRow(remove[1], row, true);
      return cursor([] as T[]);
    }
    throw new Error(`Unsupported tenant SQL: ${sql}`);
  }
}
export async function d1Transaction<T>(db: D1Database, tenantId: number, run: (sql: D1TenantSql) => Promise<T>): Promise<T> {
  const context = operationContext();
  await db.prepare('INSERT INTO business_versions(tenant_id,version) VALUES (?,0) ON CONFLICT(tenant_id) DO NOTHING').bind(tenantId).run();
  for (let attempt = 0; attempt < 8; attempt++) {
    const version = await db.prepare('SELECT version FROM business_versions WHERE tenant_id=?').bind(tenantId).first<number>('version');
    const cache = new Map<string, Row[]>();
    for (let reads = 0; reads < 20000; reads++) {
      const sql = new D1TenantSql(tenantId, cache);
      let result: T;
      try {
        result = await replayOperation(context, () => run(sql));
      } catch (error) {
        if (!(error instanceof ReadRequired)) throw error;
        const rows = await db
          .prepare(error.query.sql)
          .bind(...error.query.bindings)
          .all<Row>();
        cache.set(error.key, rows.results);
        continue;
      }
      if (!sql.writes.length) {
        const current = await db.prepare('SELECT version FROM business_versions WHERE tenant_id=?').bind(tenantId).first<number>('version');
        if (current === version) return result;
        break;
      }
      const token = operationId();
      try {
        await db.batch([
          db.prepare('UPDATE business_versions SET version=version+1 WHERE tenant_id=? AND version=?').bind(tenantId, version),
          db.prepare('INSERT INTO business_write_guards(token,matched) VALUES (?,changes())').bind(token),
          ...sql.writes.map(q => db.prepare(q.sql).bind(...q.bindings)),
          db.prepare('DELETE FROM business_write_guards WHERE token=?').bind(token),
        ]);
        return result;
      } catch (error) {
        if (error instanceof Error && /CHECK constraint failed: matched=1/.test(error.message)) break;
        throw error;
      }
    }
  }
  throw new BusinessError('conflict', 409);
}
