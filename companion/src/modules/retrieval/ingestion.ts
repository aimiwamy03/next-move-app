import { createHash } from "node:crypto";

import { getDatabase } from "@/infrastructure/db/client";

import type { EmbeddingProvider } from "./embedding-provider";
import { upsertEmbeddings, upsertRetrievalRecords } from "./repository";
import type { RetrievalRecord } from "./types";

type ResourceRow = {
  id: string;
  title: string;
  summary: string;
  category: string;
  jurisdiction: string;
  source_uri: string;
  phone: string | null;
  url: string | null;
  address: string | null;
  reviewed_at: string;
  search_text: string;
  guide_json: string;
};

type ResourceGuide = {
  aliases?: string[];
  switchAliases?: string[];
  steps?: string[];
  requirements?: string[];
  notes?: string[];
};

function parseGuide(value: string): ResourceGuide {
  try {
    const parsed = JSON.parse(value) as ResourceGuide;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function hashText(text: string): string {
  return createHash("sha256").update(text.normalize("NFC")).digest("hex");
}

export function resourceGuideRecords(now = new Date()): RetrievalRecord[] {
  const rows = getDatabase().prepare(`
    SELECT id, title, summary, category, jurisdiction, source_uri,
      phone, url, address, reviewed_at, search_text, guide_json
    FROM resource_documents
    ORDER BY id
  `).all() as unknown as ResourceRow[];

  return rows.map((row) => {
    const guide = parseGuide(row.guide_json);
    const text = [
      row.title,
      row.summary,
      row.category,
      ...(guide.aliases ?? []),
      ...(guide.switchAliases ?? []),
      ...(guide.steps ?? []),
      ...(guide.requirements ?? []),
      ...(guide.notes ?? []),
      row.search_text,
    ]
      .filter(Boolean)
      .join("\n");
    return {
      id: `resource-guide:${row.id}`,
      namespace: "community_resources",
      sourceId: row.id,
      sourceTitle: row.title,
      sourceUrl: row.source_uri,
      contentType: "structured_resource",
      language: "en",
      audience: "participant",
      topicTags: [
        row.category,
        ...(guide.aliases ?? []),
        ...(guide.switchAliases ?? []),
      ],
      sectionLabel: row.title,
      approvalStatus: "approved",
      reviewedAt: row.reviewed_at,
      jurisdiction: row.jurisdiction,
      serviceArea: row.jurisdiction,
      text,
      textHash: hashText(text),
      metadata: {
        resourceId: row.id,
        summary: row.summary,
        category: row.category,
        ...(row.phone ? { phone: row.phone } : {}),
        ...(row.url ? { url: row.url } : {}),
        ...(row.address ? { address: row.address } : {}),
        aliases: guide.aliases ?? [],
        switchAliases: guide.switchAliases ?? [],
        steps: guide.steps ?? [],
        requirements: guide.requirements ?? [],
        notes: guide.notes ?? [],
      },
      indexedAt: now.toISOString(),
    };
  });
}

export async function indexRecords(
  records: RetrievalRecord[],
  embeddingProvider: EmbeddingProvider | null,
): Promise<{ records: number; embeddings: number }> {
  const recordCount = upsertRetrievalRecords(records);
  if (!embeddingProvider || records.length === 0) {
    return { records: recordCount, embeddings: 0 };
  }

  const vectors = await embeddingProvider.embed(records.map((record) => record.text));
  const createdAt = new Date().toISOString();
  const embeddings = records.map((record, index) => ({
    recordId: record.id,
    provider: embeddingProvider.provider,
    model: embeddingProvider.model,
    dimensions: vectors[index].length,
    vector: vectors[index],
    textHash: record.textHash,
    createdAt,
  }));
  return {
    records: recordCount,
    embeddings: upsertEmbeddings(embeddings),
  };
}
