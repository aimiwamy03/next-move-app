import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { runMigrations } from "./schema";

type DatabaseGlobal = typeof globalThis & {
  __mindfulReentryDatabase?: DatabaseSync;
  __mindfulReentryDatabasePath?: string;
};

function configuredPath(): string {
  return resolve(process.env.DATABASE_PATH ?? "data/demo.sqlite");
}

export function getDatabasePath(): string {
  return configuredPath();
}

export function getDatabase(): DatabaseSync {
  const globalState = globalThis as DatabaseGlobal;
  const path = configuredPath();

  if (
    globalState.__mindfulReentryDatabase &&
    globalState.__mindfulReentryDatabasePath === path
  ) {
    return globalState.__mindfulReentryDatabase;
  }

  if (globalState.__mindfulReentryDatabase) {
    globalState.__mindfulReentryDatabase.close();
  }

  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  runMigrations(db);

  globalState.__mindfulReentryDatabase = db;
  globalState.__mindfulReentryDatabasePath = path;
  return db;
}

export function withImmediateTransaction<T>(
  operation: (db: DatabaseSync) => T,
): T {
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = operation(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function closeDatabase(): void {
  const globalState = globalThis as DatabaseGlobal;
  globalState.__mindfulReentryDatabase?.close();
  delete globalState.__mindfulReentryDatabase;
  delete globalState.__mindfulReentryDatabasePath;
}
