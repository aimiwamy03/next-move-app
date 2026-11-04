import { getDatabasePath } from "../src/infrastructure/db/client";
import { seedDemoData } from "../src/infrastructure/db/seed";
import { configuredEmbeddingProvider } from "../src/modules/retrieval/embedding-provider";
import {
  resourceGuideRecords,
  indexRecords,
} from "../src/modules/retrieval/ingestion";

async function main(): Promise<void> {
  seedDemoData();
  const retrieval = await indexRecords(
    resourceGuideRecords(),
    configuredEmbeddingProvider(),
  );
  console.log(
    JSON.stringify(
      {
        seeded: true,
        participant: "Andre",
        databasePath: getDatabasePath(),
        retrieval,
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
