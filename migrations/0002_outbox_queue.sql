ALTER TABLE directory_outbox ADD COLUMN queued_at TEXT;
CREATE INDEX directory_outbox_delivery ON directory_outbox(delivered_at,queued_at,created_at);
