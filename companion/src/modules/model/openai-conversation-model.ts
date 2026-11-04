import { z } from "zod";

import {
  ASSISTANT_OUTPUT_FORMAT,
  assistantResponseSchema,
  SAFETY_OUTPUT_FORMAT,
  safetyDecisionSchema,
  type AssistantResult,
  type ConversationAssistantInput,
  type ConversationModel,
  type ModelFailureReason,
  type SafetyClassifierInput,
  type SafetyResult,
} from "./conversation-planner";
import {
  buildAssistantPrompt,
  buildSafetyPrompt,
  type ModelPromptMessage,
} from "./conversation-prompt";
import type { FetchLike } from "./ollama-conversation-model";

export type OpenAIConversationModelOptions = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  safetyModel?: string;
  timeoutMs?: number;
  safetyTimeoutMs?: number;
  fetchImpl?: FetchLike;
};

const optionsSchema = z
  .object({
    apiKey: z.string().trim(),
    baseUrl: z.string().url(),
    model: z.string().trim().min(1).max(200),
    safetyModel: z.string().trim().min(1).max(200),
    timeoutMs: z.number().int().min(100).max(120_000),
    safetyTimeoutMs: z.number().int().min(100).max(120_000),
  })
  .strict();

const responseEnvelopeSchema = z
  .object({
    status: z.string().optional(),
    output_text: z.string().optional(),
    output: z.array(z.unknown()).optional(),
  })
  .passthrough();

function isTimeout(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function extractOutputText(value: z.output<typeof responseEnvelopeSchema>): string | null {
  if (value.output_text?.trim()) return value.output_text;

  const text: string[] = [];
  for (const item of value.output ?? []) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object" || Array.isArray(part)) continue;
      const candidate = part as Record<string, unknown>;
      if (candidate.type === "output_text" && typeof candidate.text === "string") {
        text.push(candidate.text);
      }
    }
  }
  return text.length > 0 ? text.join("") : null;
}

function reconcileChecklistConflict(
  value: unknown,
  input: ConversationAssistantInput,
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  const candidate = value as Record<string, unknown>;
  if (
    input.activeTaskId &&
    candidate.completionTaskId === input.activeTaskId &&
    typeof candidate.recommendedTaskId === "string"
  ) {
    return { ...candidate, recommendedTaskId: null };
  }

  return value;
}

/**
 * OpenAI Responses API adapter using strict Structured Outputs. Domain state,
 * grounding, and all safety actions remain owned by the existing backend.
 */
export class OpenAIConversationModel implements ConversationModel {
  readonly provider = "openai" as const;
  readonly model: string;
  readonly safetyModel: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly safetyTimeoutMs: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: OpenAIConversationModelOptions = {}) {
    const parsed = optionsSchema.parse({
      apiKey: options.apiKey ?? process.env.OPENAI_API_KEY ?? "",
      baseUrl:
        options.baseUrl ??
        process.env.OPENAI_BASE_URL ??
        "https://api.openai.com/v1",
      model:
        options.model ?? process.env.OPENAI_CHAT_MODEL ?? "gpt-6-luna",
      safetyModel:
        options.safetyModel ??
        process.env.OPENAI_SAFETY_MODEL ??
        "gpt-6-luna",
      timeoutMs:
        options.timeoutMs ??
        Number(process.env.OPENAI_CHAT_TIMEOUT_MS ?? 20_000),
      safetyTimeoutMs:
        options.safetyTimeoutMs ??
        Number(process.env.OPENAI_SAFETY_TIMEOUT_MS ?? 10_000),
    });
    this.apiKey = parsed.apiKey;
    this.baseUrl = parsed.baseUrl.replace(/\/+$/, "");
    this.model = parsed.model;
    this.safetyModel = parsed.safetyModel;
    this.timeoutMs = parsed.timeoutMs;
    this.safetyTimeoutMs = parsed.safetyTimeoutMs;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async complete(
    messages: ModelPromptMessage[],
    schema: unknown,
    options: {
      model: string;
      timeoutMs: number;
      maxOutputTokens: number;
      schemaName: string;
    },
  ): Promise<
    | { ok: true; value: unknown }
    | { ok: false; reason: ModelFailureReason }
  > {
    if (!this.apiKey) return { ok: false, reason: "provider_error" };

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options.model,
          input: messages,
          reasoning: { effort: "none" },
          text: {
            format: {
              type: "json_schema",
              name: options.schemaName,
              strict: true,
              schema,
            },
          },
          max_output_tokens: options.maxOutputTokens,
          store: false,
        }),
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      if (!response.ok) return { ok: false, reason: "provider_error" };

      const envelope = responseEnvelopeSchema.safeParse(await response.json());
      if (!envelope.success || envelope.data.status === "incomplete") {
        return { ok: false, reason: "invalid_response" };
      }
      const outputText = extractOutputText(envelope.data);
      if (!outputText) return { ok: false, reason: "invalid_response" };

      try {
        return { ok: true, value: JSON.parse(outputText) };
      } catch {
        return { ok: false, reason: "invalid_response" };
      }
    } catch (error) {
      return {
        ok: false,
        reason: isTimeout(error) ? "timeout" : "provider_error",
      };
    }
  }

  async assessSafety(input: SafetyClassifierInput): Promise<SafetyResult> {
    const completion = await this.complete(
      buildSafetyPrompt(input),
      SAFETY_OUTPUT_FORMAT,
      {
        model: this.safetyModel,
        timeoutMs: this.safetyTimeoutMs,
        maxOutputTokens: 128,
        schemaName: "boundless_safety_decision",
      },
    );
    if (!completion.ok) {
      return {
        ok: false,
        provider: this.provider,
        model: this.safetyModel,
        reason: completion.reason,
      };
    }
    const decision = safetyDecisionSchema.safeParse(completion.value);
    return decision.success
      ? {
          ok: true,
          decision: decision.data,
          provider: this.provider,
          model: this.safetyModel,
        }
      : {
          ok: false,
          provider: this.provider,
          model: this.safetyModel,
          reason: "invalid_response",
        };
  }

  async respond(input: ConversationAssistantInput): Promise<AssistantResult> {
    const completion = await this.complete(
      buildAssistantPrompt(input),
      ASSISTANT_OUTPUT_FORMAT,
      {
        model: this.model,
        timeoutMs: this.timeoutMs,
        maxOutputTokens: 512,
        schemaName: "boundless_assistant_response",
      },
    );
    if (!completion.ok) {
      return {
        ok: false,
        provider: this.provider,
        model: this.model,
        reason: completion.reason,
      };
    }

    const response = assistantResponseSchema.safeParse(
      reconcileChecklistConflict(completion.value, input),
    );
    return response.success
      ? {
          ok: true,
          response: response.data,
          provider: this.provider,
          model: this.model,
        }
      : {
          ok: false,
          provider: this.provider,
          model: this.model,
          reason: "invalid_response",
        };
  }
}
