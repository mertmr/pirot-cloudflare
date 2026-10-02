import { operationDate, operationId } from './operation-context';
import { TenantStore, TENANT_SCHEMA_VERSION } from './storage';
import { ENTITY_SPECS, type EntityKind } from './entity-specs';
import { reconciliation } from './migration';
import { BusinessError, type JsonObject, object, text, integer } from './value';
import type { CurrentUser } from './env';

// Rows are copied by SQLite in the caller's transaction. Later pages read that
// immutable copy, so cooperative activity cannot create a mixed-time backup.
export class TenantBackup {
  constructor(
    readonly store: TenantStore,
    readonly actor: CurrentUser,
  ) {}
  handle(action: string, input: JsonObject): JsonObject {
    if (!this.actor.authorities.includes('ROLE_ADMIN')) throw new BusinessError('forbidden', 403);
    this.store.sql.exec(`CREATE TABLE IF NOT EXISTS backup_runs(id TEXT PRIMARY KEY,created_at TEXT NOT NULL,metadata TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS backup_records(run_id TEXT NOT NULL,section TEXT NOT NULL,ordinal INTEGER NOT NULL,data TEXT NOT NULL,
        PRIMARY KEY(run_id,section,ordinal));`);
    const cutoff = new Date(operationDate().getTime() - 24 * 60 * 60 * 1000).toISOString();
    this.store.sql.exec('DELETE FROM backup_records WHERE run_id IN (SELECT id FROM backup_runs WHERE created_at<?)', cutoff);
    this.store.sql.exec('DELETE FROM backup_runs WHERE created_at<?', cutoff);
    if (action === 'begin') {
      if (this.store.sql.exec<{ n: number }>('SELECT count(*) AS n FROM backup_runs').one().n >= 2)
        throw new BusinessError('invalidtransition', 409);
      const id = operationId(),
        createdAt = operationDate().toISOString();
      const row = this.store.sql.exec<{ value: string }>("SELECT value FROM tenant_meta WHERE key='settings'").toArray()[0];
      const metadata: JsonObject = {
        schemaVersion: 1,
        storageSchemaVersion: TENANT_SCHEMA_VERSION,
        tenantId: this.actor.tenantId,
        session: operationId(),
        createdAt,
        expected: reconciliation(this.store),
        settings: row ? object(JSON.parse(row.value)) : null,
      };
      this.store.sql.exec('INSERT INTO backup_runs(id,created_at,metadata) VALUES (?,?,?)', id, createdAt, JSON.stringify(metadata));
      this.store.sql.exec("INSERT INTO backup_records(run_id,section,ordinal,data) SELECT ?,'entity:'||kind,id,data FROM entities", id);
      this.store.sql.exec(
        `INSERT INTO backup_records(run_id,section,ordinal,data)
        SELECT ?,'history',id,json_object('tenantId',?,'kind',kind,'entity_id',entity_id,'actor',actor,'operation',operation,'before_json',before_json,'after_json',after_json,'at',at) FROM history`,
        id,
        this.actor.tenantId,
      );
      return { id, metadata, sections: [...Object.keys(ENTITY_SPECS).map(k => `entity:${k}`), 'history'] };
    }
    const id = text(input.id);
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new BusinessError('invalidrequest');
    const run = this.store.sql.exec<{ metadata: string }>('SELECT metadata FROM backup_runs WHERE id=?', id).toArray()[0];
    if (!run) throw new BusinessError('notfound', 404);
    if (action === 'release') {
      this.store.sql.exec('DELETE FROM backup_records WHERE run_id=?', id);
      this.store.sql.exec('DELETE FROM backup_runs WHERE id=?', id);
      return { released: true };
    }
    if (action === 'page') {
      const section = text(input.section),
        after = integer(input.after ?? 0),
        size = Math.min(integer(input.size ?? 100, true), 200);
      if (
        after < 0 ||
        (section !== 'history' && !(section.startsWith('entity:') && Object.hasOwn(ENTITY_SPECS, section.slice(7) as EntityKind)))
      )
        throw new BusinessError('invalidrequest');
      const cursor = this.store.sql.exec<{ ordinal: number; data: string }>(
        'SELECT ordinal,data FROM backup_records WHERE run_id=? AND section=? AND ordinal>? ORDER BY ordinal LIMIT ?',
        id,
        section,
        after,
        size,
      );
      const rows: JsonObject[] = [];
      let bytes = 0,
        next = after,
        done = true;
      for (const row of cursor) {
        if (rows.length && bytes + row.data.length > 1_000_000) {
          done = false;
          break;
        }
        rows.push(object(JSON.parse(row.data)));
        bytes += row.data.length;
        next = row.ordinal;
      }
      if (rows.length === size) done = false;
      return { rows, next, done };
    }
    throw new BusinessError('notfound', 404);
  }
}
