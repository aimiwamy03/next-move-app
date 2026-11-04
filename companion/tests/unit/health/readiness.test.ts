import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/route";
import { closeDatabase } from "@/infrastructure/db/client";
import { seedDemoData } from "@/infrastructure/db/seed";
import {
  resourceGuideRecords,
  indexRecords,
} from "@/modules/retrieval/ingestion";
import {
  checkOpenAIConversationModels,
  checkConversationModels,
  warmConversationModel,
  warmConversationModels,
} from "@/modules/model";

describe("health retrieval readiness", () => {
  let databaseDirectory: string;
  let originalDatabasePath: string | undefined;
  let originalDemoMode: string | undefined;
  let originalLlmProvider: string | undefined;

  beforeEach(async () => {
    closeDatabase();
    originalDatabasePath = process.env.DATABASE_PATH;
    originalDemoMode = process.env.DEMO_MODE;
    originalLlmProvider = process.env.LLM_PROVIDER;
    databaseDirectory = mkdtempSync(join(tmpdir(), "mindful-reentry-health-"));
    process.env.DATABASE_PATH = join(databaseDirectory, "test.sqlite");
    process.env.LLM_PROVIDER = "ollama";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          models: [{ name: "qwen2.5:14b" }, { name: "qwen2.5:3b" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    seedDemoData({ pin: "1937" });
    await indexRecords(resourceGuideRecords(), null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    closeDatabase();
    if (originalDatabasePath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = originalDatabasePath;
    if (originalDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalDemoMode;
    if (originalLlmProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = originalLlmProvider;
    rmSync(databaseDirectory, { force: true, recursive: true });
  });

  it("accepts the reviewed source-backed records in demo mode", async () => {
    process.env.DEMO_MODE = "true";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.checks.retrieval).toMatchObject({ ok: true });
    expect(body.checks.retrieval.detail).toContain("approved");
  });

  it("keeps source-backed approved records available outside demo mode", async () => {
    process.env.DEMO_MODE = "false";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.checks.retrieval).toMatchObject({ ok: true });
    expect(body.checks.retrieval.detail).toContain("approved retrieval records");
  });

  it("warms the configured chat model with a bounded keep-alive", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));

    await expect(
      warmConversationModel({
        baseUrl: "http://127.0.0.1:11434/",
        model: "qwen2.5:14b",
        keepAlive: "30m",
        fetchImpl,
      }),
    ).resolves.toMatchObject({
      ok: true,
      model: "qwen2.5:14b",
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("http://127.0.0.1:11434/api/generate");
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "qwen2.5:14b",
      prompt: "",
      stream: false,
      keep_alive: "30m",
    });
  });

  it("checks and warms both the chat and safety models", async () => {
    const tagsFetch = vi.fn(async (
      _input: RequestInfo | URL,
      _init?: RequestInit,
    ) =>
      new Response(
        JSON.stringify({
          models: [{ name: "qwen2.5:14b" }, { name: "qwen2.5:3b" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      checkConversationModels({ fetchImpl: tagsFetch }),
    ).resolves.toMatchObject({
      ok: true,
      models: ["qwen2.5:14b", "qwen2.5:3b"],
    });

    const warmFetch = vi.fn(async (
      _input: RequestInfo | URL,
      _init?: RequestInit,
    ) => new Response("{}", { status: 200 }));
    await expect(
      warmConversationModels({ fetchImpl: warmFetch }),
    ).resolves.toMatchObject({
      ok: true,
      models: ["qwen2.5:14b", "qwen2.5:3b"],
    });
    expect(warmFetch).toHaveBeenCalledTimes(2);
    expect(
      warmFetch.mock.calls.map(([, init]) =>
        JSON.parse(String(init?.body)).model,
      ),
    ).toEqual(["qwen2.5:14b", "qwen2.5:3b"]);
  });

  it("checks OpenAI credentials and model access without a generation", async () => {
    const fetchImpl = vi.fn(async (
      _input: RequestInfo | URL,
      _init?: RequestInit,
    ) => new Response("{}", { status: 200 }));

    await expect(
      checkOpenAIConversationModels({
        apiKey: "test-key",
        model: "gpt-6-luna",
        safetyModel: "gpt-6-luna",
        fetchImpl,
      }),
    ).resolves.toMatchObject({
      ok: true,
      models: ["gpt-6-luna"],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://api.openai.com/v1/models/gpt-6-luna",
    );
  });
});
