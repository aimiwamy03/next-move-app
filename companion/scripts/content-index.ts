import { configuredEmbeddingProvider } from "../src/modules/retrieval/embedding-provider";
import { resourceGuideRecords, indexRecords } from "../src/modules/retrieval/ingestion";
import {
  approvedEmbeddableSources,
  loadRetrievalManifest,
} from "../src/modules/retrieval/manifest";

async function main(): Promise<void> {
  const manifest = loadRetrievalManifest();
  const approvedSources = approvedEmbeddableSources(manifest);
  const records = resourceGuideRecords();
  const provider = configuredEmbeddingProvider();
  const indexed = await indexRecords(records, provider);

  console.log(
    JSON.stringify(
      {
        manifest: {
          schemaVersion: manifest.schemaVersion,
          sourceCount: manifest.sources.length,
          approvedEmbeddableSourceCount: approvedSources.length,
          pendingEmbeddableSources: manifest.sources
            .filter((source) => source.embed && !approvedSources.includes(source))
            .map((source) => ({ id: source.id, status: source.status })),
        },
        resourceGuidesIncluded: records.length,
        embeddingProvider: provider
          ? { provider: provider.provider, model: provider.model }
          : null,
        indexed,
        note: "Normalized source-backed action guides were indexed. Pending long-form sources remain excluded until review.",
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
