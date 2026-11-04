import { getDatabase, getDatabasePath } from "../src/infrastructure/db/client";

const db = getDatabase();
const migrations = db.prepare(
  "SELECT version, applied_at FROM schema_migrations ORDER BY version",
).all();

console.log(
  JSON.stringify(
    { databasePath: getDatabasePath(), migrations },
    null,
    2,
  ),
);
