import { getDatabase, getDatabasePath } from "../src/infrastructure/db/client";
import { DEMO_USER_ID } from "../src/infrastructure/db/seed";
import { recommendNextTasks } from "../src/modules/checklist/service";
import { searchResources } from "../src/modules/resources/service";
import { getPracticeCatalog } from "../src/modules/practices";
import { warmConfiguredConversationModels } from "../src/modules/model";

type Check = { ok: boolean; detail: string };

async function main(): Promise<void> {
const checks: Record<string, Check> = {};
checks.demoMode = {
  ok: process.env.DEMO_MODE === "true",
  detail: "DEMO_MODE must be true.",
};
checks.demoPin = {
  ok: /^\d{4}$/.test(process.env.DEMO_PIN ?? ""),
  detail: "DEMO_PIN must contain exactly four digits.",
};
checks.demoPhone = {
  ok: /^\+[1-9]\d{7,14}$/.test(
    process.env.DEMO_PHONE_E164 ?? "+14155550123",
  ),
  detail: "DEMO_PHONE_E164 must use E.164 format.",
};
const model = await warmConfiguredConversationModels();
checks.model = { ok: model.ok, detail: model.detail };

try {
  const db = getDatabase();
  const user = db.prepare("SELECT COUNT(*) AS count FROM users WHERE id = ?").get(
    DEMO_USER_ID,
  ) as { count: number };
  const conversations = db.prepare(
    "SELECT COUNT(*) AS count FROM conversations WHERE user_id = ?",
  ).get(DEMO_USER_ID) as { count: number };
  const dependencyCycle = db.prepare(`
    WITH RECURSIVE walk(task_id, prerequisite_task_id, path, cycle) AS (
      SELECT task_id, prerequisite_task_id,
        task_id || ',' || prerequisite_task_id,
        task_id = prerequisite_task_id
      FROM task_dependencies
      UNION ALL
      SELECT walk.task_id, dependency.prerequisite_task_id,
        walk.path || ',' || dependency.prerequisite_task_id,
        instr(',' || walk.path || ',', ',' || dependency.prerequisite_task_id || ',') > 0
      FROM walk
      JOIN task_dependencies dependency ON dependency.task_id = walk.prerequisite_task_id
      WHERE walk.cycle = 0
    )
    SELECT COUNT(*) AS count FROM walk WHERE cycle = 1
  `).get() as { count: number };
  const retrievalRecords = db.prepare(`
    SELECT COUNT(*) AS count FROM retrieval_records
    WHERE approval_status IN ('approved', 'demo_only')
  `).get() as { count: number };

  checks.database = { ok: true, detail: getDatabasePath() };
  checks.seedUser = {
    ok: user.count === 1,
    detail: "The fictional Andre participant must be seeded.",
  };
  checks.conversation = {
    ok: conversations.count === 1,
    detail: "Andre must have exactly one demo conversation.",
  };
  checks.checklist = {
    ok: dependencyCycle.count === 0 && recommendNextTasks(DEMO_USER_ID, 1).length === 1,
    detail: "Checklist must be acyclic and have an eligible next task.",
  };
  checks.resource = {
    ok: (await searchResources("help with a birth certificate")).resources.length > 0,
    detail: "Known resource query must return a result.",
  };
  checks.retrievalIndex = {
    ok: retrievalRecords.count > 0,
    detail: "At least one approved or demo-only retrieval record must be indexed.",
  };
  checks.practices = {
    ok: getPracticeCatalog().practices.length === 21,
    detail: "The normalized catalog must contain all 21 text practices.",
  };
} catch (error) {
  checks.database = {
    ok: false,
    detail: error instanceof Error ? error.message : "Unknown database error",
  };
}

const ready = Object.values(checks).every((check) => check.ok);
console.log(JSON.stringify({ status: ready ? "ready" : "unavailable", checks }, null, 2));
if (!ready) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
