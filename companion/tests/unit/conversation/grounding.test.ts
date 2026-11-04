import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { closeDatabase } from "@/infrastructure/db/client";
import { DEMO_USER_ID, seedDemoData } from "@/infrastructure/db/seed";
import { listTaskCards } from "@/modules/checklist/service";
import {
  createMorningCheckIn,
  processConversationTurn,
} from "@/modules/conversation/orchestrator";
import { decideMemory, proposeMemory } from "@/modules/memory";
import type {
  AssistantResponse,
  ConversationAssistantInput,
  ConversationModel,
  SafetyClassifierInput,
} from "@/modules/model";
import {
  resourceGuideRecords,
  indexRecords,
} from "@/modules/retrieval/ingestion";
import { NEXT_MOVE_APP_URL } from "@/modules/practices";

const baseResponse: AssistantResponse = {
  text: "I’m here with you. What would be useful right now?",
  followUpQuestion: null,
  sourceResourceIds: [],
  practiceId: null,
  recommendedTaskId: null,
  completionTaskId: null,
  memoryProposal: null,
  handoffRequested: false,
  safety: null,
};

function fakeModel(options: {
  safety?: ConversationModel["assessSafety"];
  respond?: ConversationModel["respond"];
  response?: AssistantResponse | ((input: ConversationAssistantInput) => AssistantResponse);
} = {}): ConversationModel {
  return {
    provider: "ollama",
    model: "test-model",
    assessSafety: options.safety ?? (async (_input: SafetyClassifierInput) => ({
      ok: true,
      provider: "ollama",
      model: "test-model",
      decision: { safetyConcern: false, assessment: null },
    })),
    respond: options.respond ?? (async (input: ConversationAssistantInput) => ({
      ok: true,
      provider: "ollama",
      model: "test-model",
      response: typeof options.response === "function"
        ? options.response(input)
        : options.response ?? baseResponse,
    })),
  };
}

function turn(text: string, model: ConversationModel) {
  return processConversationTurn(
    {
      idempotencyKey: crypto.randomUUID(),
      channel: "web",
      participantId: DEMO_USER_ID,
      text,
      receivedAt: new Date().toISOString(),
    },
    { model },
  );
}

describe("safety-gated grounded conversation", () => {
  let databaseDirectory: string;
  let originalDatabasePath: string | undefined;
  let originalDemoMode: string | undefined;
  let originalEmbeddingProvider: string | undefined;

  beforeEach(async () => {
    closeDatabase();
    originalDatabasePath = process.env.DATABASE_PATH;
    originalDemoMode = process.env.DEMO_MODE;
    originalEmbeddingProvider = process.env.EMBEDDING_PROVIDER;
    databaseDirectory = mkdtempSync(join(tmpdir(), "mindful-reentry-grounding-"));
    process.env.DATABASE_PATH = join(databaseDirectory, "test.sqlite");
    process.env.DEMO_MODE = "true";
    delete process.env.EMBEDDING_PROVIDER;
    seedDemoData({ pin: "1937" });
    await indexRecords(resourceGuideRecords(), null);
  });

  afterEach(() => {
    closeDatabase();
    if (originalDatabasePath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = originalDatabasePath;
    if (originalDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalDemoMode;
    if (originalEmbeddingProvider === undefined) {
      delete process.env.EMBEDDING_PROVIDER;
    } else {
      process.env.EMBEDDING_PROVIDER = originalEmbeddingProvider;
    }
    rmSync(databaseDirectory, { force: true, recursive: true });
  });

  it("lets the non-safety LLM write the participant-facing response", async () => {
    const result = await turn(
      "No special words are required here.",
      fakeModel({
        response: {
          ...baseResponse,
          text: "We can work through this together. Which part feels most useful to start with?",
        },
      }),
    );

    expect(result.text).toBe(
      "We can work through this together. Which part feels most useful to start with?",
    );
    expect(result.actions).toEqual([]);
  });

  it("gives the LLM the displayed onboarding choices on the first turn", async () => {
    const seen: ConversationAssistantInput[] = [];

    await turn(
      "1",
      fakeModel({
        response: (input) => {
          seen.push(input);
          return {
            ...baseResponse,
            text: "Let’s choose one checklist step together.",
            followUpQuestion: "Would you like to begin?",
            recommendedTaskId: "mailing-address",
          };
        },
      }),
    );

    expect(seen[0].recentMessages[0]).toMatchObject({
      role: "assistant",
      text: expect.stringContaining("1️⃣ Work on my checklist"),
    });
    expect(seen[0].practices).toHaveLength(3);
    expect(seen[0].practices[0]).not.toHaveProperty("instructionText");
  });

  it("gives the assistant checklist dependencies and only consented memories", async () => {
    proposeMemory(DEMO_USER_ID, {
      category: "constraint",
      value: "Transportation is difficult.",
    });
    const accepted = proposeMemory(DEMO_USER_ID, {
      category: "contact_preference",
      value: "Please contact me by text.",
    });
    decideMemory(DEMO_USER_ID, accepted.memory.id, true);
    const seen: ConversationAssistantInput[] = [];

    await turn(
      "What should I do next?",
      fakeModel({
        response: (input) => {
          seen.push(input);
          return {
            ...baseResponse,
            text: "Let’s begin with your release ID or DMV receipt. Do you have it?",
            recommendedTaskId: "release-id-receipt",
          };
        },
      }),
    );

    expect(seen[0].acceptedMemories).toEqual([
      {
        category: "contact_preference",
        value: "Please contact me by text.",
      },
    ]);
    expect(seen[0].tasks.find((task) => task.id === "state-id")).toMatchObject({
      eligible: false,
      prerequisiteIds: ["birth-certificate"],
    });
    expect(seen[0].eligibleTaskIds).toContain("release-id-receipt");
    expect(seen[0].eligibleTaskIds).not.toContain("birth-certificate");
    expect(seen[0].eligibleTaskIds).not.toContain("state-id");
  });

  it("passes the complete retrieved record to the LLM and returns concise sourced text", async () => {
    const seen: ConversationAssistantInput[] = [];
    const result = await turn(
      "Show me the CalFresh application steps.",
      fakeModel({
        response: (input) => {
          seen.push(input);
          return {
            ...baseResponse,
            text: "Start at BenefitsCal, call LA County DPSS, or visit a DPSS office. Which option works best for you?",
            sourceResourceIds: ["calfresh-los-angeles"],
            recommendedTaskId: "apply-benefits",
          };
        },
      }),
    );

    const calfresh = seen[0].retrievedResources.find(
      (resource) => resource.id === "calfresh-los-angeles",
    );
    expect(calfresh).toMatchObject({
      title: "Apply for CalFresh food benefits",
      phone: "866-613-3777",
    });
    expect(calfresh?.steps).toHaveLength(4);
    expect(calfresh?.requirements?.length).toBeGreaterThan(0);
    expect(calfresh?.notes?.length).toBeGreaterThan(0);
    expect(result.text).toMatch(/^📌/);
    expect(result.text).not.toContain("Submit at least your name");
    expect(result.actions).toEqual([]);
    expect(result.citations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        resourceId: "calfresh-los-angeles",
        sourceUri: "https://dpss.lacounty.gov/en/food/calfresh.html",
      }),
      expect.objectContaining({
        resourceId: "calfresh-los-angeles",
        sourceUri: "https://benefitscal.com/",
      }),
    ]));
  });

  it("does not add a second scanning emoji when the model already used one", async () => {
    const result = await turn(
      "What should I work on first?",
      fakeModel({
        response: {
          ...baseResponse,
          text: "Let’s begin with one useful step.",
          followUpQuestion: "📌 Do you already have a mailing address?",
          recommendedTaskId: "release-id-receipt",
        },
      }),
    );

    expect(result.text.match(/📌/gu)).toHaveLength(1);
  });

  it("includes the active resource for an ambiguous follow-up without regex switching", async () => {
    const { acceptInboundMessage, commitAssistantReply } = await import(
      "@/modules/conversation/repository"
    );
    const accepted = acceptInboundMessage(
      DEMO_USER_ID,
      crypto.randomUUID(),
      "How do I apply for CalFresh?",
    );
    commitAssistantReply(
      accepted,
      {
        text: "Start with the application.",
        actions: [],
        citations: [
          {
            resourceId: "calfresh-los-angeles",
            title: "Apply for CalFresh food benefits",
            sourceUri: "https://dpss.lacounty.gov/en/food/calfresh.html",
            reviewedAt: "2026-10-25",
          },
        ],
        fallbackUsed: false,
      },
      crypto.randomUUID(),
    );
    const seen: ConversationAssistantInput[] = [];

    await turn(
      "Can I still start without every document?",
      fakeModel({
        response: (input) => {
          seen.push(input);
          return {
            ...baseResponse,
            text: "You can start before every document is ready.",
            sourceResourceIds: ["calfresh-los-angeles"],
          };
        },
      }),
    );

    expect(seen[0].activeResourceId).toBe("calfresh-los-angeles");
    expect(seen[0].retrievedResources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "calfresh-los-angeles" }),
      ]),
    );
  });

  it("passes the currently discussed checklist task to the LLM", async () => {
    const { acceptInboundMessage, commitAssistantReply } = await import(
      "@/modules/conversation/repository"
    );
    const mailingTask = listTaskCards(DEMO_USER_ID).find(
      (task) => task.id === "mailing-address",
    );
    expect(mailingTask).toBeTruthy();
    const accepted = acceptInboundMessage(
      DEMO_USER_ID,
      crypto.randomUUID(),
      "What should I do first?",
    );
    commitAssistantReply(
      accepted,
      {
        text: "Start with a reliable mailing address. Do you have one?",
        actions: [{ type: "next_task", task: mailingTask! }],
        citations: [],
        fallbackUsed: false,
      },
      crypto.randomUUID(),
    );
    const seen: ConversationAssistantInput[] = [];

    await turn(
      "I can receive mail at my family member’s home.",
      fakeModel({
        response: (input) => {
          seen.push(input);
          return {
            ...baseResponse,
            text: "That gives you a mailing address. Mark it complete?",
            completionTaskId: "mailing-address",
          };
        },
      }),
    );

    expect(seen[0].activeTaskId).toBe("mailing-address");
  });

  it("blocks unverified source IDs from reaching the participant", async () => {
    const result = await turn(
      "Where can I apply?",
      fakeModel({
        response: {
          ...baseResponse,
          text: "Use this invented program.",
          sourceResourceIds: ["invented-resource"],
        },
      }),
    );

    expect(result.text).toBe(
      "I don’t have enough verified information. Submit request on Boundless Freedom Project: https://boundlessfreedom.org/get-support",
    );
    expect(result.fallbackUsed).toBe(true);
    expect(result.citations).toEqual([
      expect.objectContaining({
        resourceId: "boundless-freedom-support",
        sourceUri: "https://boundlessfreedom.org/get-support",
      }),
    ]);
  });

  it("uses the dedicated safety result and never calls the normal assistant", async () => {
    const respond = vi.fn();
    const result = await turn(
      "I have a weapon and I am going to hurt someone right now.",
      fakeModel({
        safety: async () => ({
          ok: true,
          provider: "ollama",
          model: "test-model",
          decision: {
            safetyConcern: true,
            assessment: { kind: "harm_to_others", urgency: "imminent" },
          },
        }),
        respond,
      }),
    );

    expect(respond).not.toHaveBeenCalled();
    expect(result.text).toContain("Call 911 now");
    expect(result.text.split(/\s+/).filter(Boolean)).toHaveLength(21);
    expect(result.text).not.toMatch(/📌|✅|🌿/);
    expect(result.actions[0]).toMatchObject({
      type: "crisis",
      kind: "harm_to_others",
      urgency: "imminent",
    });
  });

  it("honors the assistant's independent safety escalation", async () => {
    const result = await turn(
      "I cannot stay safe.",
      fakeModel({
        response: {
          ...baseResponse,
          text: "Untrusted crisis wording.",
          safety: { kind: "self_harm", urgency: "unclear" },
        },
      }),
    );

    expect(result.text).not.toContain("Untrusted crisis wording");
    expect(result.text).toMatch(/call or text 988 now/i);
  });

  it("delivers the exact reviewed practice selected by the LLM", async () => {
    const result = await turn(
      "This form is overwhelming me.",
      fakeModel({
        response: {
          ...baseResponse,
          text: "I’m here.",
          practiceId: "sit-and-observe",
        },
      }),
    );

    expect(result.text).toContain("I’m here.");
    expect(result.text).toContain("🌿");
    expect(result.text).toContain(
      "Name three things you see, two things you hear, and one thing you feel.",
    );
    expect(result.text).toContain(NEXT_MOVE_APP_URL);
    expect(result.text.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(30);
    expect(result.actions[0]).toMatchObject({
      type: "practice",
      practiceId: "sit-and-observe",
    });
  });

  it("validates checklist recommendations and confirmations in the backend", async () => {
    const recommendation = await turn(
      "What should I work on?",
      fakeModel({
        response: {
          ...baseResponse,
          text: "Start by finding your release ID or DMV receipt.",
          recommendedTaskId: "release-id-receipt",
        },
      }),
    );
    const blocked = await turn(
      "What should I work on?",
      fakeModel({
        response: {
          ...baseResponse,
          text: "Apply for a state ID.",
          recommendedTaskId: "state-id",
        },
      }),
    );
    const completion = await turn(
      "I have my release ID receipt.",
      fakeModel({
        response: {
          ...baseResponse,
          text: "You have it. Should I mark that checklist step complete?",
          completionTaskId: "release-id-receipt",
        },
      }),
    );

    expect(recommendation.actions[0]).toMatchObject({
      type: "next_task",
      task: { id: "release-id-receipt" },
    });
    expect(recommendation.text).toMatch(/^📌/);
    expect(blocked.actions).toEqual([]);
    expect(blocked.fallbackUsed).toBe(true);
    expect(completion.actions[0]).toMatchObject({
      type: "confirm_task_completion",
      task: { id: "release-id-receipt" },
    });
    expect(completion.text).toMatch(/^✅/);
  });

  it("keeps memory writes behind the existing consent flow", async () => {
    const result = await turn(
      "Remember that I prefer text messages.",
      fakeModel({
        response: {
          ...baseResponse,
          text: "I can remember that you prefer text messages. Save it?",
          memoryProposal: {
            category: "contact_preference",
            value: "Prefers text messages.",
          },
        },
      }),
    );

    expect(result.actions[0]).toMatchObject({
      type: "confirm_memory",
      memory: {
        category: "contact_preference",
        value: "Prefers text messages.",
        status: "proposed",
      },
    });
  });

  it("keeps human handoff truthful and demo-only", async () => {
    const result = await turn(
      "Can I talk with a person?",
      fakeModel({
        response: {
          ...baseResponse,
          text: "Someone will call you now.",
          handoffRequested: true,
        },
      }),
    );

    expect(result.text).not.toContain("call you now");
    expect(result.text).toBe(
      "I don’t have enough verified information. Submit request on Boundless Freedom Project: https://boundlessfreedom.org/get-support",
    );
    expect(result.text).toContain("https://boundlessfreedom.org/get-support");
    expect(result.actions[0]).toMatchObject({ type: "handoff", demoOnly: true });
  });

  it("keeps crisis guidance only when the safety gate is unavailable", async () => {
    const safetyFailure = await turn(
      "Help me figure this out",
      fakeModel({
        safety: async () => ({
          ok: false,
          provider: "ollama",
          model: "test-model",
          reason: "provider_error",
        }),
      }),
    );
    const assistantFailure = await turn(
      "Help me figure this out",
      fakeModel({
        respond: async () => ({
          ok: false,
          provider: "ollama",
          model: "test-model",
          reason: "timeout",
        }),
      }),
    );

    expect(safetyFailure.fallbackUsed).toBe(true);
    expect(safetyFailure.text).toContain("trouble connecting");
    expect(safetyFailure.text).toContain("call or text 988");

    expect(assistantFailure.fallbackUsed).toBe(true);
    expect(assistantFailure.text).toContain("trouble connecting");
    expect(assistantFailure.text).not.toContain("911");
    expect(assistantFailure.text).not.toContain("988");
  });

  it("does not misreport a schema-invalid answer as a model outage", async () => {
    const result = await turn(
      "I can use my mom’s home as my mailing address.",
      fakeModel({
        respond: async () => ({
          ok: false,
          provider: "ollama",
          model: "test-model",
          reason: "invalid_response",
        }),
      }),
    );

    expect(result.text).toBe(
      "I’m having trouble putting that answer together. Please try once more.",
    );
    expect(result.text).not.toContain("trouble connecting");
    expect(result.text).not.toContain("988");
  });

  it("starts the daily journey with a mindful choice instead of pushing a task", () => {
    const result = createMorningCheckIn(
      DEMO_USER_ID,
      "America/Los_Angeles",
      new Date("2026-10-25T16:00:00.000Z"),
    );

    expect(result.message.text).toBe(
      "☀️ Good morning. How are you feeling? We can take a one-minute pause or choose one small step.",
    );
    expect(result.message.actions).toEqual([]);
  });
});
