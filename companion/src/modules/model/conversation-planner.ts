import { z } from "zod";

import type { ResourceCard, TaskCard } from "@/contracts/api";
import type { ConversationChannel } from "@/contracts/channels";
import { MEMORY_CATEGORIES, type MemoryCategory } from "@/modules/memory";

const safetyAssessmentSchema = z
  .object({
    kind: z.enum([
      "self_harm",
      "harm_to_others",
      "medical_emergency",
      "other_danger",
    ]),
    urgency: z.enum(["imminent", "non_imminent", "unclear"]),
  })
  .strict();

export type SafetyAssessment = z.output<typeof safetyAssessmentSchema>;

export const safetyDecisionSchema = z
  .object({
    safetyConcern: z.boolean(),
    assessment: safetyAssessmentSchema.nullable(),
  })
  .strict()
  .superRefine((decision, context) => {
    if (decision.safetyConcern && !decision.assessment) {
      context.addIssue({
        code: "custom",
        path: ["assessment"],
        message: "assessment is required when safetyConcern is true",
      });
    }
  });

export type SafetyDecision = z.output<typeof safetyDecisionSchema>;

const proposedMemorySchema = z
  .object({
    category: z.enum(MEMORY_CATEGORIES),
    value: z.string().trim().min(1).max(240),
  })
  .strict();

function nullableModelString(maxLength: number) {
  return z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0 ? null : value,
    z.string().trim().min(1).max(maxLength).nullable(),
  );
}

/**
 * The non-safety model writes the participant-facing response. Structured
 * references let the server validate citations and state-changing actions.
 */
export const assistantResponseSchema = z
  .object({
    text: z.string().trim().min(1).max(700),
    followUpQuestion: nullableModelString(120),
    sourceResourceIds: z
      .array(z.string().trim().min(1).max(100))
      .max(2),
    practiceId: nullableModelString(100),
    recommendedTaskId: nullableModelString(100),
    completionTaskId: nullableModelString(100),
    memoryProposal: proposedMemorySchema.nullable(),
    handoffRequested: z.boolean(),
    safety: safetyAssessmentSchema.nullable(),
  })
  .strict()
  .superRefine((response, context) => {
    if (
      response.followUpQuestion &&
      !response.followUpQuestion.endsWith("?")
    ) {
      context.addIssue({
        code: "custom",
        path: ["followUpQuestion"],
        message: "followUpQuestion must end with a question mark",
      });
    }
    if (
      (response.recommendedTaskId ||
        response.completionTaskId ||
        response.memoryProposal) &&
      !response.followUpQuestion
    ) {
      context.addIssue({
        code: "custom",
        path: ["followUpQuestion"],
        message: "Checklist and memory turns need one short follow-up question",
      });
    }
    if (response.practiceId && response.followUpQuestion) {
      context.addIssue({
        code: "custom",
        path: ["followUpQuestion"],
        message: "The reviewed mindfulness delivery supplies its own next action",
      });
    }
    const primaryActionCount = [
      response.practiceId,
      response.recommendedTaskId,
      response.completionTaskId,
      response.memoryProposal,
      response.handoffRequested ? "handoff" : null,
    ].filter(Boolean).length;
    if (primaryActionCount > 1) {
      context.addIssue({
        code: "custom",
        path: [],
        message: "Choose exactly one primary action for the latest message",
      });
    }
    if (response.recommendedTaskId && response.completionTaskId) {
      context.addIssue({
        code: "custom",
        path: ["recommendedTaskId"],
        message: "A response cannot recommend and complete tasks at the same time",
      });
    }
    if (response.practiceId && response.completionTaskId) {
      context.addIssue({
        code: "custom",
        path: ["practiceId"],
        message: "A mindfulness pause cannot complete a checklist task",
      });
    }
  });

export type AssistantResponse = z.output<typeof assistantResponseSchema>;

export type ConversationMessage = {
  role: "participant" | "assistant";
  text: string;
};

export type AssistantMemory = {
  category: MemoryCategory;
  value: string;
};

export type AssistantTask = TaskCard & {
  prerequisiteIds: string[];
};

export type GroundedResource = ResourceCard & {
  sourceUrl: string;
};

export type AssistantPractice = {
  id: string;
  title: string;
  tags: string[];
};

export type SafetyClassifierInput = {
  latestUserMessage: string;
  recentMessages: ConversationMessage[];
};

export type ConversationAssistantInput = {
  channel: ConversationChannel;
  latestUserMessage: string;
  recentMessages: ConversationMessage[];
  tasks: AssistantTask[];
  activeTaskId: string | null;
  eligibleTaskIds: string[];
  acceptedMemories: AssistantMemory[];
  activeResourceId: string | null;
  retrievedResources: GroundedResource[];
  practices: AssistantPractice[];
};

export type ModelFailureReason =
  | "timeout"
  | "provider_error"
  | "invalid_response";

export type ConversationModelProvider = "ollama" | "openai";

export type SafetyResult =
  | {
      ok: true;
      decision: SafetyDecision;
      provider: ConversationModelProvider;
      model: string;
    }
  | {
      ok: false;
      provider: ConversationModelProvider;
      model: string;
      reason: ModelFailureReason;
    };

export type AssistantResult =
  | {
      ok: true;
      response: AssistantResponse;
      provider: ConversationModelProvider;
      model: string;
    }
  | {
      ok: false;
      provider: ConversationModelProvider;
      model: string;
      reason: ModelFailureReason;
    };

export interface ConversationModel {
  readonly provider: ConversationModelProvider;
  readonly model: string;
  assessSafety(input: SafetyClassifierInput): Promise<SafetyResult>;
  respond(input: ConversationAssistantInput): Promise<AssistantResult>;
}

export const SAFETY_OUTPUT_FORMAT = {
  type: "object",
  properties: {
    safetyConcern: { type: "boolean" },
    assessment: {
      anyOf: [
        {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: [
                "self_harm",
                "harm_to_others",
                "medical_emergency",
                "other_danger",
              ],
            },
            urgency: {
              type: "string",
              enum: ["imminent", "non_imminent", "unclear"],
            },
          },
          required: ["kind", "urgency"],
          additionalProperties: false,
        },
        { type: "null" },
      ],
    },
  },
  required: ["safetyConcern", "assessment"],
  additionalProperties: false,
} as const;

export const ASSISTANT_OUTPUT_FORMAT = {
  type: "object",
  properties: {
    text: { type: "string" },
    followUpQuestion: { type: ["string", "null"] },
    sourceResourceIds: {
      type: "array",
      items: { type: "string" },
      maxItems: 2,
    },
    practiceId: { type: ["string", "null"] },
    recommendedTaskId: { type: ["string", "null"] },
    completionTaskId: { type: ["string", "null"] },
    memoryProposal: {
      anyOf: [
        {
          type: "object",
          properties: {
            category: { type: "string", enum: MEMORY_CATEGORIES },
            value: { type: "string" },
          },
          required: ["category", "value"],
          additionalProperties: false,
        },
        { type: "null" },
      ],
    },
    handoffRequested: { type: "boolean" },
    safety: {
      anyOf: [
        {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: [
                "self_harm",
                "harm_to_others",
                "medical_emergency",
                "other_danger",
              ],
            },
            urgency: {
              type: "string",
              enum: ["imminent", "non_imminent", "unclear"],
            },
          },
          required: ["kind", "urgency"],
          additionalProperties: false,
        },
        { type: "null" },
      ],
    },
  },
  required: [
    "text",
    "followUpQuestion",
    "sourceResourceIds",
    "practiceId",
    "recommendedTaskId",
    "completionTaskId",
    "memoryProposal",
    "handoffRequested",
    "safety",
  ],
  additionalProperties: false,
} as const;
