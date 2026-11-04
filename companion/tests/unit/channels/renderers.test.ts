import { describe, expect, it } from "vitest";

import type { TurnResult } from "@/contracts/channels";
import {
  SmsChannelRenderer,
  renderSmsTurn,
  renderWebTurn,
} from "@/modules/channels";

const task = {
  id: "state-id",
  title: "Apply for a state ID",
  description: "Bring your birth certificate and proof of address.",
  status: "not_started" as const,
  eligible: true,
};

describe("channel renderers", () => {
  it("preserves structured actions for the web client", () => {
    const result: TurnResult = {
      text: "A manageable next step is ready.",
      actions: [{ type: "next_task", task }],
      citations: [],
      fallbackUsed: false,
    };

    expect(renderWebTurn(result)).toEqual([
      {
        channel: "web",
        ...result,
      },
    ]);
  });

  it("turns every rich action into self-contained SMS text", () => {
    const result: TurnResult = {
      text: "**Here are your options.**",
      actions: [
        {
          type: "crisis",
          kind: "self_harm",
          urgency: "unclear",
          emergencyPhone: "911",
          crisisLineName: "988 Suicide & Crisis Lifeline",
          crisisPhone: "988",
          crisisText: "988",
          chatUrl: "https://988lifeline.org/chat/",
        },
        {
          type: "practice",
          practiceId: "three-breaths",
          title: "Three breaths",
          durationSeconds: 60,
          fallbackText: "Feel your feet. Take three comfortable breaths.",
          url: "https://example.org/practice/three-breaths",
        },
        {
          type: "resources",
          resources: [
            {
              id: "resource-1",
              title: "Community desk",
              summary: "Help with documents.",
              category: "identification",
              steps: [
                "Complete the official application.",
                "Submit the requested identity documents.",
              ],
              notes: ["Confirm the current fee before paying."],
              phone: "+14155550100",
              address: "10 Main Street",
              url: "https://example.org/help",
            },
          ],
        },
        { type: "confirm_task_completion", task },
        { type: "next_task", task },
        {
          type: "confirm_memory",
          memory: {
            id: "memory-1",
            category: "contact_preference",
            value: "I prefer text messages",
            status: "proposed",
          },
        },
        {
          type: "handoff",
          reason: "No reviewed result was available.",
          demoOnly: true,
        },
      ],
      citations: [
        {
          resourceId: "resource-1",
          title: "Community desk record",
          sourceUri: "https://source.example/resource-1",
          reviewedAt: "2026-10-24",
        },
      ],
      fallbackUsed: false,
    };

    const messages = renderSmsTurn(result, { maxCharacters: 1_200 });
    const text = messages.map((message) => message.text).join("\n\n");

    expect(text).toContain("Here are your options.");
    expect(text).toContain("Emergency or immediate danger: call 911");
    expect(text).toContain("call 988 or text 988");
    expect(text).toContain("https://988lifeline.org/chat/");
    expect(text).not.toContain("**");
    expect(text).toContain("Mindful practice: Three breaths (1 min)");
    expect(text).toContain("Feel your feet. Take three comfortable breaths.");
    expect(text).toContain("Optional app: https://example.org/practice/three-breaths");
    expect(text).toContain("1. Community desk");
    expect(text).toContain("Call: +14155550100");
    expect(text).toContain("1) Complete the official application.");
    expect(text).toContain("Good to know: Confirm the current fee before paying.");
    expect(text).toContain("Official link: https://example.org/help");
    expect(text).toContain("1. YES — mark it complete");
    expect(text).toContain("Next step: Apply for a state ID");
    expect(text).toContain("Remember this for future conversations");
    expect(text).toContain("1. YES — save it");
    expect(text).toContain("this prototype does not notify a staff member");
    expect(text).toContain("https://source.example/resource-1");
    expect(messages.every((message) => !("actions" in message))).toBe(true);
  });

  it("numbers parts and respects a configured soft message limit", () => {
    const result: TurnResult = {
      text: Array.from(
        { length: 30 },
        (_, index) => `word-${index}`,
      ).join(" "),
      actions: [],
      citations: [],
      fallbackUsed: false,
    };

    const messages = new SmsChannelRenderer({ maxCharacters: 80 }).render(
      result,
    );

    expect(messages.length).toBeGreaterThan(1);
    expect(messages.map((message) => message.part)).toEqual(
      messages.map((_, index) => index + 1),
    );
    expect(messages.every((message) => message.totalParts === messages.length)).toBe(
      true,
    );
    expect(messages.every((message) => message.text.length <= 80)).toBe(true);
  });

  it("does not duplicate a source URL already visible in an action", () => {
    const result: TurnResult = {
      text: "I found one option.",
      actions: [
        {
          type: "resources",
          resources: [
            {
              id: "resource-1",
              title: "Community desk",
              summary: "Help with documents.",
              category: "identification",
              url: "https://example.org/help",
            },
          ],
        },
      ],
      citations: [
        {
          resourceId: "resource-1",
          title: "Community desk",
          sourceUri: "https://example.org/help",
          reviewedAt: "2026-10-24",
        },
      ],
      fallbackUsed: false,
    };

    const text = renderSmsTurn(result)
      .map((message) => message.text)
      .join("\n");
    expect(text.match(/https:\/\/example\.org\/help/g)).toHaveLength(1);
  });
});
