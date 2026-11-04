import type { Citation, ResourceCard } from "@/contracts/api";
import { configuredEmbeddingProvider } from "@/modules/retrieval/embedding-provider";
import { resourceGuideRecords } from "@/modules/retrieval/ingestion";
import {
  listRetrievalRecords,
  upsertRetrievalRecords,
} from "@/modules/retrieval/repository";
import { retrieve } from "@/modules/retrieval/service";
import type { RetrievalHit } from "@/modules/retrieval/types";

function stringMetadata(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringArrayMetadata(
  metadata: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const value = metadata[key];
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
  return strings.length ? strings : undefined;
}

function ensureResourceIndex(): void {
  if (process.env.DEMO_MODE !== "true") return;
  // Upserts are intentional: source-backed demo guides should refresh after a
  // seed without requiring a separate indexing command.
  upsertRetrievalRecords(resourceGuideRecords());
}

export async function searchResources(
  query: string,
  limit = 1,
  preferredResourceId?: string,
): Promise<{ resources: ResourceCard[]; citations: Citation[] }> {
  ensureResourceIndex();
  const provider = configuredEmbeddingProvider();
  const allowedApprovalStatuses = process.env.DEMO_MODE === "true"
    ? (["approved", "demo_only"] as const)
    : (["approved"] as const);
  const filters = {
    namespace: "community_resources" as const,
    language: "en",
    allowedApprovalStatuses: [...allowedApprovalStatuses],
  };
  let ranked: RetrievalHit[];
  const preferred = preferredResourceId
    ? listRetrievalRecords(filters).find(
        (record) => record.sourceId === preferredResourceId,
      )
    : undefined;
  if (preferred) {
    ranked = [{ record: preferred, score: 1, matchMode: "lexical" }];
  } else {
    try {
      ranked = await retrieve(
        query,
        filters,
        { limit, embeddingProvider: provider },
      );
    } catch {
      ranked = await retrieve(
        query,
        filters,
        { limit, embeddingProvider: null },
      );
    }
  }

  return {
    resources: ranked.map(({ record }) => ({
      id: stringMetadata(record.metadata, "resourceId") ?? record.sourceId,
      title: record.sourceTitle,
      summary: stringMetadata(record.metadata, "summary") ?? record.text,
      category:
        stringMetadata(record.metadata, "category") ??
        record.topicTags[0] ??
        "general",
      ...(stringMetadata(record.metadata, "phone")
        ? { phone: stringMetadata(record.metadata, "phone") }
        : {}),
      ...(stringMetadata(record.metadata, "url")
        ? { url: stringMetadata(record.metadata, "url") }
        : {}),
      ...(stringMetadata(record.metadata, "address")
        ? { address: stringMetadata(record.metadata, "address") }
        : {}),
      ...(stringArrayMetadata(record.metadata, "steps")
        ? { steps: stringArrayMetadata(record.metadata, "steps") }
        : {}),
      ...(stringArrayMetadata(record.metadata, "requirements")
        ? { requirements: stringArrayMetadata(record.metadata, "requirements") }
        : {}),
      ...(stringArrayMetadata(record.metadata, "notes")
        ? { notes: stringArrayMetadata(record.metadata, "notes") }
        : {}),
      reviewedAt: record.reviewedAt ?? record.indexedAt,
      ...(record.approvalStatus === "demo_only" ? { demoOnly: true } : {}),
    })),
    citations: ranked.map(({ record }) => ({
      resourceId:
        stringMetadata(record.metadata, "resourceId") ?? record.sourceId,
      title:
        record.approvalStatus === "demo_only"
          ? `Demo only: ${record.sourceTitle}`
          : record.sourceTitle,
      sourceUri: record.sourceUrl,
      reviewedAt: record.reviewedAt ?? record.indexedAt,
    })),
  };
}
