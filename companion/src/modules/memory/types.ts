export const MEMORY_CATEGORIES = [
  "preference",
  "goal",
  "constraint",
  "contact_preference",
  "language",
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export type MemoryStatus = "proposed" | "accepted" | "rejected" | "deleted";

export type ParticipantMemory = {
  id: string;
  category: MemoryCategory;
  value: string;
  status: MemoryStatus;
  sourceMessageId: string | null;
  createdAt: string;
  decidedAt: string | null;
};

export type ProposeMemoryInput = {
  category: MemoryCategory;
  value: string;
  sourceMessageId?: string | null;
};

export type ProposeMemoryResult = {
  memory: ParticipantMemory;
  duplicate: boolean;
};

/** JSON returned by POST /api/memories/[id]/decision. */
export type MemoryDecisionResponse = {
  memory: ParticipantMemory;
  idempotent: boolean;
};
