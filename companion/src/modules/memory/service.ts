import { randomUUID } from "node:crypto";

import { getDatabase, withImmediateTransaction } from "@/infrastructure/db/client";

import {
  MEMORY_CATEGORIES,
  type MemoryCategory,
  type MemoryDecisionResponse,
  type MemoryStatus,
  type ParticipantMemory,
  type ProposeMemoryInput,
  type ProposeMemoryResult,
} from "./types";

export const MAX_MEMORY_VALUE_LENGTH = 240;

type MemoryRow = {
  id: string;
  category: string;
  value: string;
  status: MemoryStatus;
  source_message_id: string | null;
  created_at: string;
  decided_at: string | null;
};

const sensitivePatterns: ReadonlyArray<RegExp> = [
  /\b(?:pin|passcode|password|security\s+code|login\s+code)\b/iu,
  /\b(?:ssn|social\s+security(?:\s+number)?)\b/iu,
  /\b(?:credit|debit)\s+card\b|\b(?:bank|card|account|routing)\s+(?:number|no\.?|#)\b|\b(?:cvv|cvc)\b/iu,
  /\b(?:date\s+of\s+birth|birth\s*date|birthday)\b|\b(?:d\.?\s*o\.?\s*b\.?)(?=\s|:|$)/iu,
  /\b(?:my\s+)?address\b(?=\s*(?:is\b|:))|\b(?:home|residential|mailing|street)\s+address\b/iu,
  /\b\d{1,6}\s+[\p{L}\p{N}][\p{L}\p{N}.'-]*(?:\s+[\p{L}\p{N}][\p{L}\p{N}.'-]*){0,5}\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way|place|pl|parkway|pkwy|highway|hwy)\b/iu,
  /\b(?:diagnos(?:is|ed)|medication|medicine|meds|prescription|dosage|medical\s+(?:record|condition|history)|mental\s+health\s+diagnosis|hiv\s+status)\b/iu,
  /\b(?:lithium|sertraline|zoloft|fluoxetine|prozac|citalopram|escitalopram|lexapro|paroxetine|paxil|bupropion|wellbutrin|venlafaxine|effexor|duloxetine|cymbalta|mirtazapine|quetiapine|seroquel|olanzapine|zyprexa|risperidone|risperdal|aripiprazole|abilify|clozapine|haloperidol|valproate|divalproex|lamotrigine|carbamazepine|gabapentin|alprazolam|xanax|clonazepam|klonopin|lorazepam|ativan|diazepam|trazodone|buspirone|adderall|vyvanse|methylphenidate|suboxone|buprenorphine|methadone|naloxone|insulin|metformin|lisinopril|losartan|amlodipine|propranolol|levothyroxine)\b/iu,
  /\b(?:bipolar(?:\s+disorder)?|schizophrenia|post[-\s]?traumatic\s+stress\s+disorder|ptsd|attention[-\s]?deficit(?:\/hyperactivity)?\s+disorder|adhd|obsessive[-\s]?compulsive\s+disorder|ocd|major\s+depress(?:ion|ive\s+disorder)|anxiety\s+disorder|diabetes|epilepsy|cancer|hiv|aids|hepatitis)\b/iu,
  /\b(?:case|docket)\s*(?:number|no\.?|#)\b|\b(?:attorney[-\s]?client|criminal\s+charge|conviction\s+details|legal\s+case)\b/iu,
  /\b\d{3}-\d{2}-\d{4}\b/u,
  /\b(?:\d[ -]*){13,19}\b/u,
];

export class MemoryValidationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_CATEGORY"
      | "INVALID_VALUE"
      | "SENSITIVE_CONTENT"
      | "SOURCE_MESSAGE_NOT_FOUND",
  ) {
    super(message);
    this.name = "MemoryValidationError";
  }
}

export class MemoryNotFoundError extends Error {
  constructor() {
    super("Memory proposal was not found.");
    this.name = "MemoryNotFoundError";
  }
}

export class MemoryDecisionConflictError extends Error {
  constructor(currentStatus: MemoryStatus) {
    super(`Memory proposal has already been finalized as ${currentStatus}.`);
    this.name = "MemoryDecisionConflictError";
  }
}

function isMemoryCategory(value: string): value is MemoryCategory {
  return (MEMORY_CATEGORIES as readonly string[]).includes(value);
}

function toMemory(row: MemoryRow): ParticipantMemory {
  if (!isMemoryCategory(row.category)) {
    throw new Error(`Unexpected memory category in database: ${row.category}`);
  }

  return {
    id: row.id,
    category: row.category,
    value: row.value,
    status: row.status,
    sourceMessageId: row.source_message_id,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

function normalizeMemoryValue(value: unknown): string {
  if (typeof value !== "string") {
    throw new MemoryValidationError(
      "Memory value must be text.",
      "INVALID_VALUE",
    );
  }

  const normalized = value.normalize("NFKC").replace(/\s+/gu, " ").trim();
  if (normalized.length === 0 || normalized.length > MAX_MEMORY_VALUE_LENGTH) {
    throw new MemoryValidationError(
      `Memory value must be between 1 and ${MAX_MEMORY_VALUE_LENGTH} characters.`,
      "INVALID_VALUE",
    );
  }
  if (/^[\d\s-]{4,19}$/u.test(normalized)) {
    throw new MemoryValidationError(
      "Security and account numbers cannot be saved as memory.",
      "SENSITIVE_CONTENT",
    );
  }
  if (sensitivePatterns.some((pattern) => pattern.test(normalized))) {
    throw new MemoryValidationError(
      "Sensitive credentials, identity details, addresses, payment data, or medical or legal details cannot be saved as memory.",
      "SENSITIVE_CONTENT",
    );
  }
  return normalized;
}

/**
 * Creates a consent proposal only. Proposed values are never returned by
 * listAcceptedMemories until the participant explicitly accepts them.
 */
export function proposeMemory(
  userId: string,
  input: ProposeMemoryInput,
): ProposeMemoryResult {
  if (!isMemoryCategory(input.category)) {
    throw new MemoryValidationError(
      "Memory category is not allowed.",
      "INVALID_CATEGORY",
    );
  }
  const value = normalizeMemoryValue(input.value);
  const sourceMessageId = input.sourceMessageId ?? null;

  return withImmediateTransaction((db) => {
    if (sourceMessageId) {
      const ownedSource = db.prepare(`
        SELECT 1 AS present
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = ? AND c.user_id = ?
      `).get(sourceMessageId, userId);
      if (!ownedSource) {
        throw new MemoryValidationError(
          "Source message was not found for this participant.",
          "SOURCE_MESSAGE_NOT_FOUND",
        );
      }
    }

    const duplicate = db.prepare(`
      SELECT id, category, value, status, source_message_id, created_at, decided_at
      FROM participant_memories
      WHERE user_id = ? AND category = ? AND value = ?
        AND status IN ('proposed', 'accepted')
      ORDER BY CASE status WHEN 'accepted' THEN 0 ELSE 1 END, created_at
      LIMIT 1
    `).get(userId, input.category, value) as MemoryRow | undefined;

    if (duplicate) {
      return { memory: toMemory(duplicate), duplicate: true };
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO participant_memories (
        id, user_id, category, value, status, source_message_id,
        created_at, decided_at
      ) VALUES (?, ?, ?, ?, 'proposed', ?, ?, NULL)
    `).run(
      id,
      userId,
      input.category,
      value,
      sourceMessageId,
      createdAt,
    );

    return {
      memory: {
        id,
        category: input.category,
        value,
        status: "proposed",
        sourceMessageId,
        createdAt,
        decidedAt: null,
      },
      duplicate: false,
    };
  });
}

/** Only consented memories are exposed for prompting or personalization. */
export function listAcceptedMemories(userId: string): ParticipantMemory[] {
  const rows = getDatabase().prepare(`
    SELECT id, category, value, status, source_message_id, created_at, decided_at
    FROM participant_memories
    WHERE user_id = ? AND status = 'accepted'
    ORDER BY created_at, id
  `).all(userId) as unknown as MemoryRow[];
  return rows.map(toMemory);
}

export function listMemoryStatuses(
  userId: string,
): Array<{ id: string; status: MemoryStatus }> {
  const rows = getDatabase().prepare(`
    SELECT id, status FROM participant_memories
    WHERE user_id = ? AND status <> 'deleted'
    ORDER BY created_at, id
  `).all(userId) as unknown as Array<{ id: string; status: MemoryStatus }>;
  return rows;
}

/**
 * Finalizes a proposal. Repeating the same decision is idempotent; attempting
 * to reverse an existing decision is a conflict and never mutates the row.
 */
export function decideMemory(
  userId: string,
  memoryId: string,
  accepted: boolean,
): MemoryDecisionResponse {
  const desiredStatus: MemoryStatus = accepted ? "accepted" : "rejected";

  return withImmediateTransaction((db) => {
    const existing = db.prepare(`
      SELECT id, category, value, status, source_message_id, created_at, decided_at
      FROM participant_memories
      WHERE id = ? AND user_id = ?
    `).get(memoryId, userId) as MemoryRow | undefined;

    if (!existing) throw new MemoryNotFoundError();
    if (existing.status === desiredStatus) {
      return { memory: toMemory(existing), idempotent: true };
    }
    if (existing.status !== "proposed") {
      throw new MemoryDecisionConflictError(existing.status);
    }

    const decidedAt = new Date().toISOString();
    db.prepare(`
      UPDATE participant_memories
      SET status = ?, decided_at = ?
      WHERE id = ? AND user_id = ? AND status = 'proposed'
    `).run(desiredStatus, decidedAt, memoryId, userId);

    return {
      memory: toMemory({
        ...existing,
        status: desiredStatus,
        decided_at: decidedAt,
      }),
      idempotent: false,
    };
  });
}
