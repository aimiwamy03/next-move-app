export const RETRIEVAL_NAMESPACES = [
  "mindfulness_practices",
  "bfp_program_information",
  "community_resources",
] as const;

export type RetrievalNamespace = (typeof RETRIEVAL_NAMESPACES)[number];

export type ApprovalStatus = "approved" | "demo_only" | "pending_review";

export type RetrievalRecord = {
  id: string;
  namespace: RetrievalNamespace;
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  contentType: string;
  language: string;
  audience: string;
  topicTags: string[];
  sectionLabel: string;
  approvalStatus: ApprovalStatus;
  reviewedAt?: string;
  jurisdiction?: string;
  serviceArea?: string;
  text: string;
  textHash: string;
  metadata: Record<string, unknown>;
  indexedAt: string;
};

export type RetrievalFilters = {
  namespace: RetrievalNamespace;
  language?: string;
  jurisdiction?: string;
  allowedApprovalStatuses?: ApprovalStatus[];
};

export type RetrievalHit = {
  record: RetrievalRecord;
  score: number;
  matchMode: "lexical" | "semantic" | "hybrid";
};

export type StoredEmbedding = {
  recordId: string;
  provider: string;
  model: string;
  dimensions: number;
  vector: number[];
  textHash: string;
  createdAt: string;
};
