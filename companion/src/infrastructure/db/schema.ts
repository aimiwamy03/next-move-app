import type { DatabaseSync } from "node:sqlite";

const migrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone_e164 TEXT NOT NULL UNIQUE,
        preferred_name TEXT NOT NULL,
        timezone TEXT NOT NULL,
        state TEXT,
        county TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pin_credentials (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        pin_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        last_used_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        channel TEXT NOT NULL DEFAULT 'web',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        client_message_id TEXT,
        in_reply_to_message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('participant', 'assistant')),
        kind TEXT NOT NULL CHECK (kind IN ('inbound', 'reply', 'proactive')),
        text TEXT NOT NULL,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        CHECK (
          (role = 'participant' AND kind = 'inbound' AND client_message_id IS NOT NULL AND in_reply_to_message_id IS NULL)
          OR
          (role = 'assistant' AND kind = 'reply' AND client_message_id IS NULL AND in_reply_to_message_id IS NOT NULL)
          OR
          (role = 'assistant' AND kind = 'proactive' AND client_message_id IS NULL AND in_reply_to_message_id IS NULL)
        )
      );

      CREATE UNIQUE INDEX IF NOT EXISTS messages_client_id_unique
        ON messages(conversation_id, client_message_id)
        WHERE client_message_id IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS messages_reply_unique
        ON messages(conversation_id, in_reply_to_message_id)
        WHERE in_reply_to_message_id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS task_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        base_priority INTEGER NOT NULL DEFAULT 0,
        estimated_minutes INTEGER,
        initial_status TEXT NOT NULL DEFAULT 'not_started'
          CHECK (initial_status IN ('not_started', 'in_progress', 'waiting', 'blocked', 'completed', 'not_applicable'))
      );

      CREATE TABLE IF NOT EXISTS task_dependencies (
        task_id TEXT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
        prerequisite_task_id TEXT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, prerequisite_task_id),
        CHECK (task_id <> prerequisite_task_id)
      );

      CREATE TABLE IF NOT EXISTS user_tasks (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id TEXT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'waiting', 'blocked', 'completed', 'not_applicable')),
        started_at TEXT,
        completed_at TEXT,
        PRIMARY KEY (user_id, task_id)
      );

      CREATE TABLE IF NOT EXISTS practice_catalog (
        practice_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        path TEXT NOT NULL,
        fallback_text TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS resource_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        category TEXT NOT NULL,
        jurisdiction TEXT NOT NULL,
        source_uri TEXT NOT NULL,
        phone TEXT,
        url TEXT,
        address TEXT,
        reviewed_at TEXT NOT NULL,
        search_text TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS outbound_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        local_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (user_id, kind, local_date)
      );
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE messages
        ADD COLUMN channel TEXT NOT NULL DEFAULT 'web'
        CHECK (channel IN ('web', 'sms'));

      CREATE TABLE IF NOT EXISTS retrieval_records (
        id TEXT PRIMARY KEY,
        namespace TEXT NOT NULL,
        source_id TEXT NOT NULL,
        source_title TEXT NOT NULL,
        source_url TEXT NOT NULL,
        content_type TEXT NOT NULL,
        language TEXT NOT NULL,
        audience TEXT NOT NULL,
        topic_tags_json TEXT NOT NULL DEFAULT '[]',
        section_label TEXT NOT NULL,
        approval_status TEXT NOT NULL,
        reviewed_at TEXT,
        jurisdiction TEXT,
        service_area TEXT,
        text TEXT NOT NULL,
        text_hash TEXT NOT NULL,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        indexed_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS retrieval_records_filter_idx
        ON retrieval_records(namespace, approval_status, language);

      CREATE TABLE IF NOT EXISTS retrieval_embeddings (
        record_id TEXT NOT NULL REFERENCES retrieval_records(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        vector_json TEXT NOT NULL,
        text_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (record_id, provider, model)
      );

      CREATE TABLE IF NOT EXISTS participant_memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        value TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'proposed'
          CHECK (status IN ('proposed', 'accepted', 'rejected', 'deleted')),
        source_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        decided_at TEXT
      );

      CREATE INDEX IF NOT EXISTS participant_memories_user_status_idx
        ON participant_memories(user_id, status);
    `,
  },
  {
    version: 3,
    sql: `
      ALTER TABLE resource_documents
        ADD COLUMN guide_json TEXT NOT NULL DEFAULT '{}';
    `,
  },
  {
    version: 4,
    sql: `
      ALTER TABLE task_templates
        ADD COLUMN phase TEXT NOT NULL DEFAULT 'Your plan';
      ALTER TABLE task_templates
        ADD COLUMN phase_order INTEGER NOT NULL DEFAULT 0;
    `,
  },
] as const;

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const hasVersion = db.prepare(
    "SELECT 1 AS present FROM schema_migrations WHERE version = ?",
  );
  const recordVersion = db.prepare(
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
  );

  for (const migration of migrations) {
    if (hasVersion.get(migration.version)) continue;

    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(migration.sql);
      recordVersion.run(migration.version, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}
