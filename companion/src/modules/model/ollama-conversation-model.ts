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

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type OllamaConversationModelOptions = {
  baseUrl?: string;
  model?: string;
  safetyModel?: string;
  timeoutMs?: number;
  safetyTimeoutMs?: number;
  contextTokens?: number;
  safetyContextTokens?: number;
  keepAlive?: string;
  fetchImpl?: FetchLike;
};

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

const optionsSchema = z
  .object({
    baseUrl: z.string().url(),
    model: z.string().trim().min(1).max(200),
    safetyModel: z.string().trim().min(1).max(200),
    timeoutMs: z.number().int().min(100).max(120_000),
    safetyTimeoutMs: z.number().int().min(100).max(120_000),
    contextTokens: z.number().int().min(2_048).max(131_072),
    safetyContextTokens: z.number().int().min(1_024).max(32_768),
    keepAlive: z.string().trim().min(1).max(20),
  })
  .strict();

const envelopeSchema = z
  .object({
    message: z
      .object({
        role: z.literal("assistant"),
        content: z.string(),
      })
      .passthrough(),
    done: z.literal(true),
  })
  .passthrough();

function isTimeout(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

/**
 * Two bounded structured calls: a narrow safety gate followed, when safe, by
 * the persona-driven assistant. There is no regex or rule-based intent router.
 */
export class OllamaConversationModel implements ConversationModel {
  readonly provider = "ollama" as const;
  readonly model: string;
  readonly safetyModel: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly safetyTimeoutMs: number;
  private readonly contextTokens: number;
  private readonly safetyContextTokens: number;
  private readonly keepAlive: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: OllamaConversationModelOptions = {}) {
    const parsed = optionsSchema.parse({
      baseUrl:
        options.baseUrl ??
        process.env.OLLAMA_BASE_URL ??
        "http://127.0.0.1:11434",
      model:
        options.model ?? process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:14b",
      safetyModel:
        options.safetyModel ??
        process.env.OLLAMA_SAFETY_MODEL ??
        "qwen2.5:3b",
      timeoutMs:
        options.timeoutMs ?? Number(process.env.OLLAMA_CHAT_TIMEOUT_MS ?? 30_000),
      safetyTimeoutMs:
        options.safetyTimeoutMs ??
        Number(process.env.OLLAMA_SAFETY_TIMEOUT_MS ?? 15_000),
      contextTokens:
        options.contextTokens ??
        Number(process.env.OLLAMA_CONTEXT_TOKENS ?? 4_096),
      safetyContextTokens:
        options.safetyContextTokens ??
        Number(process.env.OLLAMA_SAFETY_CONTEXT_TOKENS ?? 2_048),
      keepAlive:
        options.keepAlive ?? process.env.OLLAMA_KEEP_ALIVE ?? "30m",
    });
    this.baseUrl = parsed.baseUrl.replace(/\/+$/, "");
    this.model = parsed.model;
    this.safetyModel = parsed.safetyModel;
    this.timeoutMs = parsed.timeoutMs;
    this.safetyTimeoutMs = parsed.safetyTimeoutMs;
    this.contextTokens = parsed.contextTokens;
    this.safetyContextTokens = parsed.safetyContextTokens;
    this.keepAlive = parsed.keepAlive;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async complete(
    messages: ModelPromptMessage[],
    format: unknown,
    options: {
      model: string;
      timeoutMs: number;
      contextTokens: number;
      temperature: number;
      numPredict: number;
    },
  ): Promise<
    | { ok: true; value: unknown }
    | { ok: false; reason: ModelFailureReason }
  > {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: options.model,
          messages,
          stream: false,
          format,
          keep_alive: this.keepAlive,
          options: {
            temperature: options.temperature,
            num_predict: options.numPredict,
            num_ctx: options.contextTokens,
          },
        }),
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      if (!response.ok) return { ok: false, reason: "provider_error" };

      let envelopeValue: unknown;
      try {
        envelopeValue = await response.json();
      } catch {
        return { ok: false, reason: "invalid_response" };
      }
      const envelope = envelopeSchema.safeParse(envelopeValue);
      if (!envelope.success) return { ok: false, reason: "invalid_response" };

      try {
        return { ok: true, value: JSON.parse(envelope.data.message.content) };
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
        contextTokens: this.safetyContextTokens,
        temperature: 0,
        numPredict: 64,
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
    if (!decision.success) {
      console.warn(
        "Safety classifier returned a schema-invalid decision:",
        JSON.stringify(decision.error.issues),
      );
      return {
        ok: false,
        provider: this.provider,
        model: this.safetyModel,
        reason: "invalid_response",
      };
    }
    return {
      ok: true,
      decision: decision.data,
      provider: this.provider,
      model: this.safetyModel,
    };
  }

  async respond(input: ConversationAssistantInput): Promise<AssistantResult> {
    const completion = await this.complete(
      buildAssistantPrompt(input),
      ASSISTANT_OUTPUT_FORMAT,
      {
        model: this.model,
        timeoutMs: this.timeoutMs,
        contextTokens: this.contextTokens,
        temperature: 0,
        numPredict: 220,
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

    // Empty strings in nullable fields are a harmless local-model formatting
    // quirk. The schema normalizes them to null. Semantic contradictions still
    // fail closed, without paying for a second generation.
    const response = assistantResponseSchema.safeParse(
      reconcileChecklistConflict(completion.value, input),
    );
    if (response.success) {
      return {
        ok: true,
        response: response.data,
        provider: this.provider,
        model: this.model,
      };
    }

    console.warn(
      "Conversation assistant returned a schema-invalid response:",
      JSON.stringify(response.error.issues),
    );
    return {
      ok: false,
      provider: this.provider,
      model: this.model,
      reason: "invalid_response",
    };
  }
}
