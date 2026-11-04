import { describe, expect, it } from "vitest";

import {
  selectPractice,
  selectPracticeForText,
  splitSmsMessages,
} from "@/modules/practices";

describe("practice selection", () => {
  it("uses a neutral grounding practice when there is no context", () => {
    const result = selectPractice();

    expect(result.practice.id).toBe("sit-and-observe");
    expect(result.fallbackUsed).toBe(true);
  });

  it("selects deterministically from participant language", () => {
    const first = selectPractice({
      userText: "I am walking to an appointment and feel distracted.",
    });
    const second = selectPractice({
      userText: "I am walking to an appointment and feel distracted.",
    });

    expect(first.practice.id).toBe("transition-moments");
    expect(second.practice.id).toBe(first.practice.id);
    expect(first.matchedTags).toEqual(
      expect.arrayContaining(["appointment", "transition", "walking"]),
    );
    expect(first.fallbackUsed).toBe(false);
  });

  it("honors explicit tags and direct practice names", () => {
    expect(selectPractice({ desiredTags: ["gratitude"] }).practice.id).toBe(
      "gratitude",
    );
    expect(
      selectPractice({ userText: "Could we try box breathing?" }).practice.id,
    ).toBe("box-breathing");
  });

  it("does not treat a consent-based hug as a generic breathing exercise", () => {
    const result = selectPractice({
      userText: "I feel overwhelmed and want help with breathing.",
      recentPracticeIds: ["mindful-breathing"],
    });

    expect(result.practice.id).not.toBe("mindful-hug");
    expect(result.practice.tags).toContain("grounding");
  });

  it("does not repeat a recently delivered practice while choices remain", () => {
    const first = selectPractice({ userText: "I feel overwhelmed." });
    const next = selectPractice({
      userText: "I still feel overwhelmed.",
      recentPracticeIds: [first.practice.id],
    });

    expect(next.practice.id).not.toBe(first.practice.id);
    expect(next.matchedTags).toContain("overwhelm");
  });

  it("avoids excluded categories when another practice is available", () => {
    const result = selectPractice({
      userText: "I feel stressed and would like to breathe.",
      excludedTags: ["breathing"],
    });

    expect(result.practice.tags).not.toContain("breathing");
    expect(result.practice.tags).toContain("stress");
  });
});

describe("text practice delivery", () => {
  it("puts the safety message first and returns complete SMS-sized text", () => {
    const result = selectPracticeForText({ desiredTags: ["self-compassion"] });

    expect(result.smsMessages[0]).toBe(result.safetyIntro);
    expect(result.fullText).toContain(result.safetyIntro);
    expect(result.fullText).toContain(result.instructionText);
    expect(result.smsMessages.join(" ")).toContain("This is hard");
    expect(result.smsMessages.every((message) => message.length <= 160)).toBe(
      true,
    );
  });

  it("splits long text on bounded segments", () => {
    const messages = splitSmsMessages(
      "one two three four five six seven eight nine ten eleven twelve",
      20,
    );

    expect(messages.length).toBeGreaterThan(1);
    expect(messages.every((message) => message.length <= 20)).toBe(true);
    expect(messages.join(" ")).toBe(
      "one two three four five six seven eight nine ten eleven twelve",
    );
  });
});
