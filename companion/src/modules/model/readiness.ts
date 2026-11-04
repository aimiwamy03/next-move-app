import { z } from "zod";

import type { FetchLike } from "./ollama-conversation-model";
import { OpenAIConversationModel } from "./openai-conversation-model";

const tagsSchema = z
  .object({
    models: z.array(
      z
        .object({
          name: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export type ModelReadiness = {
  ok: boolean;
  model: string;
  models: string[];
  detail: string;
};

type ModelConnectionOptions = {
  baseUrl?: string;
  model?: string;
  safetyModel?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
};

type OpenAIConnectionOptions = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  safetyModel?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
};

function configuredModel(options: ModelConnectionOptions) {
  return {
    baseUrl: (
      options.baseUrl ??
      process.env.OLLAMA_BASE_URL ??
      "http://127.0.0.1:11434"
    ).replace(/\/+$/, ""),
    model: options.model ?? process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:14b",
    safetyModel:
      options.safetyModel ??
      process.env.OLLAMA_SAFETY_MODEL ??
      "qwen2.5:3b",
    fetchImpl: options.fetchImpl ?? fetch,
  };
}

function unavailable(model: string, detail: string): ModelReadiness {
  return { ok: false, model, models: [model], detail };
}

export async function checkConversationModel(
  options: ModelConnectionOptions = {},
): Promise<ModelReadiness> {
  const { baseUrl, model, fetchImpl } = configuredModel(options);

  try {
    const response = await fetchImpl(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 2_000),
      cache: "no-store",
    });
    if (!response.ok) {
      return unavailable(model, "Ollama did not pass its readiness check.");
    }
    const parsed = tagsSchema.safeParse(await response.json());
    if (!parsed.success) {
      return unavailable(model, "Ollama returned an invalid model list.");
    }
    const installed = parsed.data.models.some(
      (candidate) =>
        candidate.name === model || candidate.name.startsWith(`${model}:`),
    );
    return installed
      ? { ok: true, model, models: [model], detail: `Ollama is ready with ${model}.` }
      : unavailable(model, `Required Ollama model ${model} is not installed.`);
  } catch {
    return unavailable(model, "Ollama is not reachable.");
  }
}

export async function checkConversationModels(
  options: ModelConnectionOptions = {},
): Promise<ModelReadiness> {
  const { baseUrl, model, safetyModel, fetchImpl } = configuredModel(options);
  const models = [...new Set([model, safetyModel])];

  try {
    const response = await fetchImpl(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 2_000),
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, model, models, detail: "Ollama did not pass its readiness check." };
    }
    const parsed = tagsSchema.safeParse(await response.json());
    if (!parsed.success) {
      return { ok: false, model, models, detail: "Ollama returned an invalid model list." };
    }
    const missing = models.filter(
      (required) =>
        !parsed.data.models.some(
          (candidate) =>
            candidate.name === required ||
            candidate.name.startsWith(`${required}:`),
        ),
    );
    return missing.length === 0
      ? {
          ok: true,
          model,
          models,
          detail: `Ollama is ready with ${models.join(" and ")}.`,
        }
      : {
          ok: false,
          model,
          models,
          detail: `Required Ollama model${missing.length === 1 ? "" : "s"} ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not installed.`,
        };
  } catch {
    return { ok: false, model, models, detail: "Ollama is not reachable." };
  }
}

export async function warmConversationModel(
  options: ModelConnectionOptions & { keepAlive?: string } = {},
): Promise<ModelReadiness> {
  const { baseUrl, model, fetchImpl } = configuredModel(options);
  const keepAlive =
    options.keepAlive ?? process.env.OLLAMA_KEEP_ALIVE ?? "30m";

  try {
    const response = await fetchImpl(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: "",
        stream: false,
        keep_alive: keepAlive,
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
    });
    return response.ok
      ? {
          ok: true,
          model,
          models: [model],
          detail: `Ollama loaded ${model} for ${keepAlive}.`,
        }
      : unavailable(model, `Ollama could not load ${model}.`);
  } catch {
    return unavailable(model, "Ollama could not warm the chat model.");
  }
}

export async function warmConversationModels(
  options: ModelConnectionOptions & { keepAlive?: string } = {},
): Promise<ModelReadiness> {
  const configured = configuredModel(options);
  const models = [...new Set([configured.model, configured.safetyModel])];
  const warmed: ModelReadiness[] = [];

  for (const model of models) {
    warmed.push(
      await warmConversationModel({
        ...options,
        model,
        fetchImpl: configured.fetchImpl,
      }),
    );
  }

  const failed = warmed.filter((result) => !result.ok);
  return {
    ok: failed.length === 0,
    model: configured.model,
    models,
    detail:
      failed.length === 0
        ? `Ollama loaded ${models.join(" and ")} for ${options.keepAlive ?? process.env.OLLAMA_KEEP_ALIVE ?? "30m"}.`
        : failed.map((result) => result.detail).join(" "),
  };
}

export async function checkOpenAIConversationModels(
  options: OpenAIConnectionOptions = {},
): Promise<ModelReadiness> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const baseUrl = (
    options.baseUrl ??
    process.env.OPENAI_BASE_URL ??
    "https://api.openai.com/v1"
  ).replace(/\/+$/, "");
  const model =
    options.model ?? process.env.OPENAI_CHAT_MODEL ?? "gpt-6-luna";
  const safetyModel =
    options.safetyModel ??
    process.env.OPENAI_SAFETY_MODEL ??
    "gpt-6-luna";
  const models = [...new Set([model, safetyModel])];
  if (!apiKey) {
    return {
      ok: false,
      model,
      models,
      detail: "OPENAI_API_KEY is not configured.",
    };
  }

  try {
    const responses = await Promise.all(
      models.map((required) =>
        (options.fetchImpl ?? fetch)(
          `${baseUrl}/models/${encodeURIComponent(required)}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(options.timeoutMs ?? 5_000),
            cache: "no-store",
          },
        ),
      ),
    );
    const failed = models.filter((_, index) => !responses[index].ok);
    return failed.length === 0
      ? {
          ok: true,
          model,
          models,
          detail: `OpenAI is ready with ${models.join(" and ")}.`,
        }
      : {
          ok: false,
          model,
          models,
          detail: `OpenAI could not access ${failed.join(", ")}.`,
        };
  } catch {
    return {
      ok: false,
      model,
      models,
      detail: "OpenAI is not reachable.",
    };
  }
}

export function checkConfiguredConversationModels(): Promise<ModelReadiness> {
  return process.env.LLM_PROVIDER === "openai"
    ? checkOpenAIConversationModels()
    : checkConversationModels();
}

async function probeOpenAIConversationModels(): Promise<ModelReadiness> {
  const readiness = await checkOpenAIConversationModels();
  if (!readiness.ok) return readiness;

  const model = new OpenAIConversationModel();
  const probe = await model.assessSafety({
    latestUserMessage: "I would like help with my checklist.",
    recentMessages: [],
  });
  return probe.ok
    ? {
        ...readiness,
        detail: `OpenAI completed a structured response with ${readiness.model}.`,
      }
    : {
        ...readiness,
        ok: false,
        detail: "OpenAI model access exists, but a response could not be generated. Check API credits and rate limits.",
      };
}

export function warmConfiguredConversationModels(): Promise<ModelReadiness> {
  // Hosted OpenAI models do not need a local warm-up. The same readiness call
  // validates credentials, quota, model access, and the structured schema.
  return process.env.LLM_PROVIDER === "openai"
    ? probeOpenAIConversationModels()
    : warmConversationModels();
}
