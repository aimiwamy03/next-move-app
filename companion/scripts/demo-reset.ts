import { getDatabasePath } from "../src/infrastructure/db/client";
import { resetDemoData } from "../src/infrastructure/db/seed";
import { warmConfiguredConversationModels } from "../src/modules/model";

if (process.env.DEMO_MODE !== "true") {
  throw new Error("Set DEMO_MODE=true before resetting demo data");
}

async function main(): Promise<void> {
  resetDemoData();
  const model = await warmConfiguredConversationModels();
  console.log(
    JSON.stringify(
      {
        reset: true,
        databasePath: getDatabasePath(),
        modelWarm: model.ok,
        models: model.models,
      },
      null,
      2,
    ),
  );
  if (!model.ok) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
