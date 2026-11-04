import { z } from "zod";

export const pinRequestSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
  pin: z.string().regex(/^\d{4}$/),
});

export const chatRequestSchema = z.object({
  clientMessageId: z.string().uuid(),
  text: z.string().trim().min(1).max(2_000),
});

export const memoryDecisionSchema = z.object({
  accepted: z.boolean(),
});

export const resetRequestSchema = z.object({
  confirm: z.literal("RESET_DEMO"),
});

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "blocked"
  | "completed"
  | "not_applicable";

export type TaskCard = {
  id: string;
  title: string;
  description: string;
  phase?: string;
  status: TaskStatus;
  reason?: string;
  estimatedMinutes?: number;
  eligible: boolean;
};

export type ResourceCard = {
  id: string;
  title: string;
  summary: string;
  category: string;
  phone?: string;
  url?: string;
  address?: string;
  steps?: string[];
  requirements?: string[];
  notes?: string[];
  reviewedAt?: string;
  demoOnly?: boolean;
};

export type Citation = {
  resourceId: string;
  title: string;
  sourceUri: string;
  reviewedAt: string;
};

export type PracticeAction = {
  type: "practice";
  practiceId: string;
  title: string;
  durationSeconds: number;
  url?: string;
  fallbackText: string;
};

export type CrisisKind =
  | "self_harm"
  | "harm_to_others"
  | "medical_emergency"
  | "other_danger";

export type CrisisUrgency = "imminent" | "non_imminent" | "unclear";

export type CrisisAction = {
  type: "crisis";
  kind: CrisisKind;
  urgency: CrisisUrgency;
  emergencyPhone: "911";
  crisisLineName: string;
  crisisPhone: "988";
  crisisText: "988";
  chatUrl: string;
};

export type MemoryCategory =
  | "preference"
  | "goal"
  | "constraint"
  | "contact_preference"
  | "language";

export type MemoryStatus = "proposed" | "accepted" | "rejected" | "deleted";

export type MemoryProposal = {
  id: string;
  category: MemoryCategory;
  value: string;
  status: MemoryStatus;
};

export type ChatUiAction =
  | PracticeAction
  | CrisisAction
  | { type: "resources"; resources: ResourceCard[] }
  | { type: "confirm_task_completion"; task: TaskCard }
  | { type: "next_task"; task: TaskCard }
  | { type: "confirm_memory"; memory: MemoryProposal }
  | { type: "handoff"; reason: string; demoOnly: true };

export type ChatMessage = {
  id: string;
  role: "participant" | "assistant";
  text: string;
  createdAt: string;
  actions: ChatUiAction[];
  citations: Citation[];
  fallbackUsed: boolean;
};

export type BootstrapResponse = {
  participant: {
    preferredName: string;
    maskedPhone: string;
  };
  messages: ChatMessage[];
  tasks: TaskCard[];
  recommendedTasks: TaskCard[];
  memoryStatuses: Array<{ id: string; status: MemoryStatus }>;
  features: {
    demoMode: boolean;
    practiceAvailable: boolean;
    modelProvider: "ollama";
  };
};

export type MemoryDecisionResponse = {
  memory: MemoryProposal;
  idempotent: boolean;
};

export type ChatResponse = {
  message: ChatMessage;
  meta: {
    requestId: string;
    fallbackUsed: boolean;
  };
};

export type TaskCompletionResponse = {
  completedTask: TaskCard;
  newlyUnlocked: TaskCard[];
};

export type OutboundMessage = {
  message: ChatMessage;
  kind: "morning_check_in";
  localDate: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    requestId: string;
    retryAfterSeconds?: number;
  };
};
