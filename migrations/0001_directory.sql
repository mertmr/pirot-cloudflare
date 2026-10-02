CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY,
  tenant_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL COLLATE NOCASE UNIQUE,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  lang_key TEXT NOT NULL DEFAULT 'tr',
  activated INTEGER NOT NULL DEFAULT 0 CHECK(activated IN (0,1)),
  tenant_id INTEGER REFERENCES tenants(id),
  authorities TEXT NOT NULL DEFAULT '["ROLE_USER"]' CHECK(json_valid(authorities)),
  activation_key TEXT UNIQUE,
  reset_key TEXT UNIQUE,
  reset_date TEXT,
  session_version INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT 'system',
  created_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_modified_by TEXT,
  last_modified_date TEXT
);
CREATE INDEX IF NOT EXISTS users_tenant ON users(tenant_id, activated);
CREATE TABLE IF NOT EXISTS auth_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, principal TEXT NOT NULL, tenant_id INTEGER,
 event_type TEXT NOT NULL, event_date TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS auth_audit_tenant_date ON auth_audit(tenant_id, event_date);
CREATE TABLE IF NOT EXISTS rate_limits (
 key TEXT PRIMARY KEY, count INTEGER NOT NULL, window_start INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS directory_outbox (
 id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)), created_at TEXT NOT NULL,
 delivered_at TEXT
);
