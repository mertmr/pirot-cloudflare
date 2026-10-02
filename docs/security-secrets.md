# Runtime secrets and operational data

Keep `AUTH_SECRET`, bootstrap secrets, administrator passwords, account tokens, and exported application data outside Git. Local setup generates ignored `.dev.vars`; deployed signing secrets are entered through `wrangler secret put AUTH_SECRET --env staging` or the separately configured production environment.

Do not put secrets in command arguments, shell history, screenshots, logs, public issues, or CI output. Never copy the legacy production signing key into staging. Use private directories with mode 700 and files with mode 600 for backup and migration operations, and retain encrypted operational backups.

Cloudflare database IDs, Worker URLs, and queue names identify resources; they do not authorize access. The checked-in staging identifiers refer to the existing deployment. CI has no Cloudflare credentials, GitHub deployment secrets, or production data. Forks should provision separate resources.

Use synthetic local fixtures and isolated Docker databases for tests. Production data imports and cutovers require explicit authorization and reconciliation. A full D1 export includes account password hashes and personal/business data, so treat it as confidential even though it contains no plaintext account passwords. Retain the signing secret separately when session continuity is needed during recovery.

If a credential is exposed, revoke or rotate it at the provider, invalidate affected sessions, and investigate access. Removing it from a later commit does not remove it from repository history.
