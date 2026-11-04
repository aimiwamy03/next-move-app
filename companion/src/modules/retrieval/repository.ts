import { getDatabase, withImmediateTransaction } from "@/infrastructure/db/client";

import type {
  ApprovalStatus,
  RetrievalFilters,
  RetrievalRecord,
  StoredEmbedding,
} from "./types";

type RetrievalRow = {
  id: string;
  namespace: RetrievalRecord["namespace"];
  source_id: string;
  source_title: string;
  source_url: string;
  content_type: string;
  language: string;
  audience: string;
  topic_tags_json: string;
  section_label: string;
  approval_status: ApprovalStatus;
  reviewed_at: string | null;
  jurisdiction: string | null;
  service_area: string | null;
  text: string;
  text_hash: string;
  metadata_json: string;
  indexed_at: string;
};

type EmbeddingRow = {
  record_id: string;
  provider: string;
  model: string;
  dimensions: number;
  vector_json: string;
  text_hash: string;
  created_at: string;
};

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toRecord(row: RetrievalRow): RetrievalRecord {
  return {
    id: row.id,
    namespace: row.namespace,
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    contentType: row.content_type,
    language: row.language,
    audience: row.audience,
    topicTags: parseJson<string[]>(row.topic_tags_json, []),
    sectionLabel: row.section_label,
    approvalStatus: row.approval_status,
    ...(row.reviewed_at ? { reviewedAt: row.reviewed_at } : {}),
    ...(row.jurisdiction ? { jurisdiction: row.jurisdiction } : {}),
    ...(row.service_area ? { serviceArea: row.service_area } : {}),
    text: row.text,
    textHash: row.text_hash,
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
    indexedAt: row.indexed_at,
  };
}

export function upsertRetrievalRecords(records: RetrievalRecord[]): number {
  if (records.length === 0) return 0;
  return withImmediateTransaction((db) => {
    const upsert = db.prepare(`
      INSERT INTO retrieval_records (
        id, namespace, source_id, source_title, source_url, content_type,
        language, audience, topic_tags_json, section_label, approval_status,
        reviewed_at, jurisdiction, service_area, text, text_hash,
        metadata_json, indexed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        namespace = excluded.namespace,
        source_id = excluded.source_id,
        source_title = excluded.source_title,
        source_url = excluded.source_url,
        content_type = excluded.content_type,
        language = excluded.language,
        audience = excluded.audience,
        topic_tags_json = excluded.topic_tags_json,
        section_label = excluded.section_label,
        approval_status = excluded.approval_status,
        reviewed_at = excluded.reviewed_at,
        jurisdiction = excluded.jurisdiction,
        service_area = excluded.service_area,
        text = excluded.text,
        text_hash = excluded.text_hash,
        metadata_json = excluded.metadata_json,
        indexed_at = excluded.indexed_at
    `);
    for (const record of records) {
      upsert.run(
        record.id,
        record.namespace,
        record.sourceId,
        record.sourceTitle,
        record.sourceUrl,
        record.contentType,
        record.language,
        record.audience,
        JSON.stringify(record.topicTags),
        record.sectionLabel,
        record.approvalStatus,
        record.reviewedAt ?? null,
        record.jurisdiction ?? null,
        record.serviceArea ?? null,
        record.text,
        record.textHash,
        JSON.stringify(record.metadata),
        record.indexedAt,
      );
    }
    return records.length;
  });
}

export function listRetrievalRecords(filters: RetrievalFilters): RetrievalRecord[] {
  const clauses = ["namespace = ?"];
  const parameters: Array<string> = [filters.namespace];

  if (filters.language) {
    clauses.push("language = ?");
    parameters.push(filters.language);
  }
  if (filters.jurisdiction) {
    clauses.push("(jurisdiction IS NULL OR jurisdiction = ?)");
    parameters.push(filters.jurisdiction);
  }
  const statuses = filters.allowedApprovalStatuses ?? ["approved"];
  if (statuses.length === 0) return [];
  clauses.push(`approval_status IN (${statuses.map(() => "?").join(", ")})`);
  parameters.push(...statuses);

  const rows = getDatabase().prepare(`
    SELECT * FROM retrieval_records
    WHERE ${clauses.join(" AND ")}
    ORDER BY source_title, section_label, id
  `).all(...parameters) as unknown as RetrievalRow[];
  return rows.map(toRecord);
}

export function upsertEmbeddings(embeddings: StoredEmbedding[]): number {
  if (embeddings.length === 0) return 0;
  return withImmediateTransaction((db) => {
    const upsert = db.prepare(`
      INSERT INTO retrieval_embeddings (
        record_id, provider, model, dimensions, vector_json, text_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(record_id, provider, model) DO UPDATE SET
        dimensions = excluded.dimensions,
        vector_json = excluded.vector_json,
        text_hash = excluded.text_hash,
        created_at = excluded.created_at
    `);
    for (const embedding of embeddings) {
      upsert.run(
        embedding.recordId,
        embedding.provider,
        embedding.model,
        embedding.dimensions,
        JSON.stringify(embedding.vector),
        embedding.textHash,
        embedding.createdAt,
      );
    }
    return embeddings.length;
  });
}

export function embeddingsForRecords(
  recordIds: string[],
  provider: string,
  model: string,
): Map<string, StoredEmbedding> {
  if (recordIds.length === 0) return new Map();
  const placeholders = recordIds.map(() => "?").join(", ");
  const rows = getDatabase().prepare(`
    SELECT * FROM retrieval_embeddings
    WHERE provider = ? AND model = ? AND record_id IN (${placeholders})
  `).all(provider, model, ...recordIds) as unknown as EmbeddingRow[];

  return new Map(
    rows.map((row) => [
      row.record_id,
      {
        recordId: row.record_id,
        provider: row.provider,
        model: row.model,
        dimensions: row.dimensions,
        vector: parseJson<number[]>(row.vector_json, []),
        textHash: row.text_hash,
        createdAt: row.created_at,
      },
    ]),
  );
}
