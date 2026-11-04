import { describe, expect, it, vi } from "vitest";

import {
  ASSISTANT_OUTPUT_FORMAT,
  buildAssistantPrompt,
  buildSafetyPrompt,
  OllamaConversationModel,
  SAFETY_OUTPUT_FORMAT,
  type ConversationAssistantInput,
  type SafetyClassifierInput,
} from "@/modules/model";

const safetyInput: SafetyClassifierInput = {
  latestUserMessage: "This paperwork is killing me, but I am not in danger.",
  recentMessages: [],
};

const assistantInput: ConversationAssistantInput = {
  channel: "web",
  latestUserMessage: "What should I do next?",
  recentMessages: [],
  tasks: [
    {
      id: "birth-certificate",
      title: "Request a birth certificate",
      description: "Request an authorized certified copy.",
      phase: "First week",
      status: "not_started",
      eligible: true,
      prerequisiteIds: [],
    },
  ],
  activeTaskId: null,
  eligibleTaskIds: ["birth-certificate"],
  acceptedMemories: [
    { category: "constraint", value: "Transportation is difficult." },
  ],
  activeResourceId: "calfresh-los-angeles",
  retrievedResources: [
    {
      id: "calfresh-los-angeles",
      title: "Apply for CalFresh food benefits",
      summary: "Apply online, by phone, by mail, or in person.",
      category: "food benefits",
      steps: ["Start at BenefitsCal or call the county."],
      requirements: ["Name, address, and signature to start"],
      notes: ["Every document is not required to submit the first application."],
      url: "https://benefitscal.com/",
      sourceUrl: "https://dpss.lacounty.gov/en/food/calfresh.html",
    },
  ],
  practices: [
    {
      id: "sit-and-observe",
      title: "Sit and Observe",
      tags: ["overwhelm", "grounding"],
    },
  ],
};

function response(content: unknown): Response {
  return new Response(
    JSON.stringify({
      model: "test-model",
      message: {
        role: "assistant",
        content: typeof content === "string" ? content : JSON.stringify(content),
      },
      done: true,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

const normalResponse = {
  text: "Because transportation is difficult, starting online may work better.",
  followUpQuestion: "Would you like the first step?",
  sourceResourceIds: [],
  practiceId: null,
  recommendedTaskId: "birth-certificate",
  completionTaskId: null,
  memoryProposal: null,
  handoffRequested: false,
  safety: null,
};

describe("safety-gated conversation model", () => {
  it("keeps safety classification narrow and independent", () => {
    const prompt = buildSafetyPrompt(safetyInput)
      .map((message) => message.content)
      .join("\n");

    expect(prompt).toContain("Classify only the latest participant message");
    expect(prompt).toContain("past resolved events");
    expect(prompt).toContain(safetyInput.latestUserMessage);
    expect(prompt).not.toContain("retrievedResources");
  });

  it("gives the assistant persona, checklist, memories, resources, and practices", () => {
    const prompt = buildAssistantPrompt(assistantInput)
      .map((message) => message.content)
      .join("\n");

    expect(prompt).toContain("calm, practical guide");
    expect(prompt).toContain("Never exceed 30 words");
    expect(prompt).toContain("Use at most one emoji");
    expect(prompt).toContain("Give one step at a time");
    expect(prompt).toContain("“3” means a mindful pause");
    expect(prompt).toContain("empathetic transition of at most 12 words");
    expect(prompt).toContain("activeTaskId");
    expect(prompt).toContain("birth-certificate");
    expect(prompt).toContain("Transportation is difficult");
    expect(prompt).toContain("calfresh-los-angeles");
    expect(prompt).toContain("sit-and-observe");
    expect(prompt).not.toContain("keyword matching");
  });

  it("uses a dedicated structured safety call", async () => {
    const fetchImpl = vi.fn(async () =>
      response({ safetyConcern: false, assessment: null }),
    );
    const model = new OllamaConversationModel({
      baseUrl: "http://127.0.0.1:11434/",
      model: "test-model",
      safetyModel: "test-safety-model",
      timeoutMs: 500,
      fetchImpl,
    });

    await expect(model.assessSafety(safetyInput)).resolves.toMatchObject({
      ok: true,
      decision: { safetyConcern: false, assessment: null },
    });

    const [, init] = fetchImpl.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("test-safety-model");
    expect(body.format).toEqual(SAFETY_OUTPUT_FORMAT);
    expect(body.options.temperature).toBe(0);
    expect(body.options.num_ctx).toBe(2_048);
    expect(body.options.num_predict).toBe(64);
  });

  it("lets the non-safety model write a structured final response", async () => {
    const fetchImpl = vi.fn(async () => response(normalResponse));
    const model = new OllamaConversationModel({
      model: "test-model",
      contextTokens: 4_096,
      keepAlive: "30m",
      fetchImpl,
    });

    await expect(model.respond(assistantInput)).resolves.toMatchObject({
      ok: true,
      response: {
        text: normalResponse.text,
        recommendedTaskId: "birth-certificate",
      },
    });

    const [, init] = fetchImpl.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];
    const body = JSON.parse(String(init?.body));
    expect(body.format).toEqual(ASSISTANT_OUTPUT_FORMAT);
    expect(body.keep_alive).toBe("30m");
    expect(body.model).toBe("test-model");
    expect(body.options.num_ctx).toBe(4_096);
    expect(body.options.num_predict).toBe(220);
    expect(body.options.temperature).toBe(0);
  });

  it("allows the assistant to raise a second safety signal", async () => {
    const model = new OllamaConversationModel({
      fetchImpl: async () => response({
        ...normalResponse,
        text: "Server-owned crisis wording will be used.",
        recommendedTaskId: null,
        safety: { kind: "harm_to_others", urgency: "unclear" },
      }),
    });

    await expect(model.respond(assistantInput)).resolves.toMatchObject({
      ok: true,
      response: {
        safety: { kind: "harm_to_others", urgency: "unclear" },
      },
    });
  });

  it("rejects malformed or conflicting structured responses", async () => {
    const malformed = new OllamaConversationModel({
      fetchImpl: async () => response({ text: "Missing fields" }),
    });
    const conflicting = new OllamaConversationModel({
      fetchImpl: async () => response({
        ...normalResponse,
        completionTaskId: "birth-certificate",
      }),
    });

    await expect(malformed.respond(assistantInput)).resolves.toMatchObject({
      ok: false,
      reason: "invalid_response",
    });
    await expect(conflicting.respond(assistantInput)).resolves.toMatchObject({
      ok: false,
      reason: "invalid_response",
    });
  });

  it("keeps word-count and emoji style guidance non-fatal", async () => {
    const fetchImpl = vi.fn(async () => response({
      ...normalResponse,
      text: "📌 This deliberately long checklist response contains more than thirty words so presentation drift cannot replace an otherwise useful answer with a generic fallback message. 📌 The backend still validates its structured action fields.",
    }));
    const model = new OllamaConversationModel({ fetchImpl });

    await expect(model.respond(assistantInput)).resolves.toMatchObject({
      ok: true,
      response: {
        recommendedTaskId: "birth-certificate",
      },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("normalizes empty optional strings without a repair generation", async () => {
    const fetchImpl = vi.fn(async () => response({
      ...normalResponse,
      followUpQuestion: "",
      recommendedTaskId: "",
    }));
    const model = new OllamaConversationModel({ fetchImpl });

    await expect(model.respond(assistantInput)).resolves.toMatchObject({
      ok: true,
      response: {
        followUpQuestion: null,
        recommendedTaskId: null,
      },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("keeps current-task completion without a second model call when the reply also recommends another task", async () => {
    const conflicted = {
      ...normalResponse,
      completionTaskId: "birth-certificate",
    };
    const fetchImpl = vi.fn(async () => response(conflicted));
    const model = new OllamaConversationModel({ fetchImpl });

    await expect(
      model.respond({ ...assistantInput, activeTaskId: "birth-certificate" }),
    ).resolves.toMatchObject({
      ok: true,
      response: {
        completionTaskId: "birth-certificate",
        recommendedTaskId: null,
      },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects long model-written text before reviewed practice instructions", async () => {
    const longPracticeResponse = {
      ...normalResponse,
      text: "Sit down and name three things you see, two things you hear, and one thing you can feel right now.",
      practiceId: "sit-and-observe",
      recommendedTaskId: null,
    };
    const model = new OllamaConversationModel({
      fetchImpl: async () => response(longPracticeResponse),
    });

    await expect(model.respond(assistantInput)).resolves.toMatchObject({
      ok: false,
      reason: "invalid_response",
    });
  });

  it("reports provider and timeout failures", async () => {
    const providerFailure = new OllamaConversationModel({
      fetchImpl: async () => new Response("no", { status: 503 }),
    });
    const timeout = new OllamaConversationModel({
      fetchImpl: async () => {
        throw new DOMException("timed out", "TimeoutError");
      },
    });

    await expect(providerFailure.assessSafety(safetyInput)).resolves.toMatchObject({
      ok: false,
      reason: "provider_error",
    });
    await expect(timeout.assessSafety(safetyInput)).resolves.toMatchObject({
      ok: false,
      reason: "timeout",
    });
  });
});
