import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { closeDatabase, getDatabase } from "@/infrastructure/db/client";
import { DEMO_USER_ID, seedDemoData } from "@/infrastructure/db/seed";
import {
  decideMemory,
  listAcceptedMemories,
  MAX_MEMORY_VALUE_LENGTH,
  MemoryDecisionConflictError,
  MemoryNotFoundError,
  MemoryValidationError,
  proposeMemory,
} from "@/modules/memory";

describe("participant memory service", () => {
  let databaseDirectory: string;
  let originalDatabasePath: string | undefined;

  beforeEach(() => {
    closeDatabase();
    originalDatabasePath = process.env.DATABASE_PATH;
    databaseDirectory = mkdtempSync(join(tmpdir(), "mindful-reentry-memory-"));
    process.env.DATABASE_PATH = join(databaseDirectory, "test.sqlite");
    seedDemoData({ pin: "1937" });
  });

  afterEach(() => {
    closeDatabase();
    if (originalDatabasePath === undefined) {
      delete process.env.DATABASE_PATH;
    } else {
      process.env.DATABASE_PATH = originalDatabasePath;
    }
    rmSync(databaseDirectory, { force: true, recursive: true });
  });

  it("keeps a normalized proposal out of memory until explicit acceptance", () => {
    const proposal = proposeMemory(DEMO_USER_ID, {
      category: "contact_preference",
      value: "  Please   contact me by text.\n ",
    });

    expect(proposal).toMatchObject({
      duplicate: false,
      memory: {
        category: "contact_preference",
        status: "proposed",
        value: "Please contact me by text.",
      },
    });
    expect(listAcceptedMemories(DEMO_USER_ID)).toEqual([]);

    const decision = decideMemory(DEMO_USER_ID, proposal.memory.id, true);
    expect(decision).toMatchObject({
      idempotent: false,
      memory: { status: "accepted" },
    });
    expect(decision.memory.decidedAt).not.toBeNull();
    expect(listAcceptedMemories(DEMO_USER_ID)).toEqual([decision.memory]);

    const repeated = decideMemory(DEMO_USER_ID, proposal.memory.id, true);
    expect(repeated).toEqual({ memory: decision.memory, idempotent: true });

    const duplicate = proposeMemory(DEMO_USER_ID, {
      category: "contact_preference",
      value: "Please contact me by text.",
    });
    expect(duplicate).toEqual({ memory: decision.memory, duplicate: true });
  });

  it("makes rejection idempotent but never reverses a final decision", () => {
    const { memory } = proposeMemory(DEMO_USER_ID, {
      category: "goal",
      value: "Apply for a state ID",
    });

    const rejected = decideMemory(DEMO_USER_ID, memory.id, false);
    expect(rejected.memory.status).toBe("rejected");
    expect(decideMemory(DEMO_USER_ID, memory.id, false)).toEqual({
      memory: rejected.memory,
      idempotent: true,
    });
    expect(() => decideMemory(DEMO_USER_ID, memory.id, true)).toThrow(
      MemoryDecisionConflictError,
    );
    expect(listAcceptedMemories(DEMO_USER_ID)).toEqual([]);
  });

  it("does not reveal or mutate another participant's proposal", () => {
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO users (
        id, phone_e164, preferred_name, timezone, state, county, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "second-participant",
      "+14155550124",
      "Taylor",
      "America/Los_Angeles",
      "CA",
      "Los Angeles",
      now,
    );
    const { memory } = proposeMemory(DEMO_USER_ID, {
      category: "language",
      value: "Spanish",
    });

    expect(() => decideMemory("second-participant", memory.id, true)).toThrow(
      MemoryNotFoundError,
    );
    expect(listAcceptedMemories("second-participant")).toEqual([]);
    expect(
      getDatabase()
        .prepare("SELECT status FROM participant_memories WHERE id = ?")
        .get(memory.id),
    ).toEqual({ status: "proposed" });
  });

  it.each([
    "My PIN is 1937",
    "password: swordfish",
    "SSN 123-45-6789",
    "credit card number 4111 1111 1111 1111",
    "My date of birth is January 3, 1984",
    "DOB: 01/03/1984",
    "D.O.B. 01/03/1984",
    "My birthday is January 3",
    "My home address is 123 Main Street",
    "My address is 45 Oak Rd",
    "I live at 845 West Sunset Boulevard",
    "My medical diagnosis is private",
    "I take lithium",
    "I am on Zoloft",
    "I have bipolar disorder",
    "I live with diabetes",
    "My legal case number is LA-204",
    "1937",
  ])("refuses sensitive content without writing it: %s", (value) => {
    expect(() =>
      proposeMemory(DEMO_USER_ID, { category: "constraint", value }),
    ).toThrow(MemoryValidationError);
    expect(
      getDatabase()
        .prepare("SELECT COUNT(*) AS count FROM participant_memories")
        .get(),
    ).toEqual({ count: 0 });
  });

  it.each([
    ["contact_preference", "Please contact me by text after 5 PM."],
    ["goal", "My goal is to attend the Tuesday support group."],
    ["preference", "I check my task list each morning."],
    ["constraint", "I usually take the bus to appointments."],
  ] as const)(
    "allows a non-sensitive %s memory: %s",
    (category, value) => {
      expect(proposeMemory(DEMO_USER_ID, { category, value })).toMatchObject({
        duplicate: false,
        memory: { category, status: "proposed", value },
      });
    },
  );

  it("rejects unknown categories, oversized values, and unowned source messages", () => {
    expect(() =>
      proposeMemory(DEMO_USER_ID, {
        category: "medical" as never,
        value: "private",
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_CATEGORY" }));

    expect(() =>
      proposeMemory(DEMO_USER_ID, {
        category: "preference",
        value: "x".repeat(MAX_MEMORY_VALUE_LENGTH + 1),
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_VALUE" }));

    expect(() =>
      proposeMemory(DEMO_USER_ID, {
        category: "goal",
        value: "Find stable housing",
        sourceMessageId: "not-this-participant-message",
      }),
    ).toThrowError(expect.objectContaining({ code: "SOURCE_MESSAGE_NOT_FOUND" }));
  });
});
