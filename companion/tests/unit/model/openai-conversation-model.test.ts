import { describe, expect, it, vi } from "vitest";

import {
  ASSISTANT_OUTPUT_FORMAT,
  OpenAIConversationModel,
  SAFETY_OUTPUT_FORMAT,
  type ConversationAssistantInput,
  type SafetyClassifierInput,
} from "@/modules/model";

const safetyInput: SafetyClassifierInput = {
  latestUserMessage: "I need help with paperwork.",
  recentMessages: [],
};

const assistantInput: ConversationAssistantInput = {
  channel: "web",
  latestUserMessage: "What should I do first?",
  recentMessages: [],
  tasks: [],
  activeTaskId: null,
  eligibleTaskIds: [],
  acceptedMemories: [],
  activeResourceId: null,
  retrievedResources: [],
  practices: [],
};

function response(content: unknown): Response {
  return new Response(
    JSON.stringify({
      status: "completed",
      output: [
        {
          type: "message",
          content: [
            { type: "output_text", text: JSON.stringify(content) },
          ],
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

const assistantResponse = {
  text: "Let’s choose one small step.",
  followUpQuestion: "Would you like checklist help?",
  sourceResourceIds: [],
  practiceId: null,
  recommendedTaskId: null,
  completionTaskId: null,
  memoryProposal: null,
  handoffRequested: false,
  safety: null,
};

describe("OpenAI conversation model", () => {
  it("uses the Responses API and strict Structured Outputs for safety", async () => {
    const fetchImpl = vi.fn(async () =>
      response({ safetyConcern: false, assessment: null }),
    );
    const model = new OpenAIConversationModel({
      apiKey: "test-key",
      model: "gpt-6-luna",
      safetyModel: "gpt-6-luna",
      fetchImpl,
    });

    await expect(model.assessSafety(safetyInput)).resolves.toMatchObject({
      ok: true,
      provider: "openai",
      model: "gpt-6-luna",
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(init.body));
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(body).toMatchObject({
      model: "gpt-6-luna",
      reasoning: { effort: "none" },
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "boundless_safety_decision",
          strict: true,
          schema: SAFETY_OUTPUT_FORMAT,
        },
      },
    });
  });

  it("returns the existing assistant contract from structured output", async () => {
    const fetchImpl = vi.fn(async () => response(assistantResponse));
    const model = new OpenAIConversationModel({
      apiKey: "test-key",
      fetchImpl,
    });

    await expect(model.respond(assistantInput)).resolves.toMatchObject({
      ok: true,
      provider: "openai",
      response: assistantResponse,
    });

    const [, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(init.body));
    expect(body.text.format).toMatchObject({
      type: "json_schema",
      name: "boundless_assistant_response",
      strict: true,
      schema: ASSISTANT_OUTPUT_FORMAT,
    });
  });

  it("fails safely when the API key is missing", async () => {
    const fetchImpl = vi.fn();
    const model = new OpenAIConversationModel({ apiKey: "", fetchImpl });

    await expect(model.assessSafety(safetyInput)).resolves.toMatchObject({
      ok: false,
      provider: "openai",
      reason: "provider_error",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
