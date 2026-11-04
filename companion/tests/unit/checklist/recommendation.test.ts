import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { closeDatabase } from "@/infrastructure/db/client";
import { DEMO_USER_ID, seedDemoData } from "@/infrastructure/db/seed";
import {
  completeTask,
  listTaskCards,
  recommendNextTasks,
} from "@/modules/checklist/service";

describe("checklist recommendation", () => {
  let databaseDirectory: string;
  let originalDatabasePath: string | undefined;

  beforeEach(() => {
    closeDatabase();
    originalDatabasePath = process.env.DATABASE_PATH;
    databaseDirectory = mkdtempSync(join(tmpdir(), "mindful-reentry-checklist-"));
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

  it("starts the fictional participant at the beginning of the release-day checklist", () => {
    const tasks = listTaskCards(DEMO_USER_ID);

    expect(tasks.filter((task) => task.status === "completed")).toHaveLength(0);
    expect(tasks.find((task) => task.id === "release-id-receipt")).toMatchObject({
      eligible: true,
      status: "not_started",
    });
    expect(tasks.find((task) => task.id === "birth-certificate")).toMatchObject({
      eligible: false,
      status: "not_started",
    });
    expect(tasks.find((task) => task.id === "state-id")).toMatchObject({
      eligible: false,
      status: "not_started",
    });
    expect(tasks.find((task) => task.id === "job-readiness")).toMatchObject({
      eligible: false,
      status: "not_started",
    });

    expect(recommendNextTasks(DEMO_USER_ID, 2).map((task) => task.id)[0]).toBe(
      "mailing-address",
    );
  });

  it("recommends the newly unlocked step after its prerequisite is completed", () => {
    completeTask(DEMO_USER_ID, "release-papers");
    const prerequisites = completeTask(DEMO_USER_ID, "mailing-address");

    expect(prerequisites.newlyUnlocked.map((task) => task.id)).toContain(
      "birth-certificate",
    );

    const result = completeTask(DEMO_USER_ID, "birth-certificate");

    expect(result.completedTask).toMatchObject({
      eligible: false,
      id: "birth-certificate",
      status: "completed",
    });
    expect(result.newlyUnlocked.map((task) => task.id)).toEqual(["state-id"]);
    expect(listTaskCards(DEMO_USER_ID).find((task) => task.id === "state-id")).toMatchObject({
      eligible: true,
      status: "not_started",
    });
  });

  it("returns the current recommendation when completion is retried", () => {
    completeTask(DEMO_USER_ID, "release-papers");
    completeTask(DEMO_USER_ID, "mailing-address");
    completeTask(DEMO_USER_ID, "birth-certificate");

    const retry = completeTask(DEMO_USER_ID, "birth-certificate");

    expect(retry.completedTask).toMatchObject({
      id: "birth-certificate",
      status: "completed",
    });
    expect(retry.newlyUnlocked.map((task) => task.id)).toEqual([
      "release-id-receipt",
    ]);
  });
});
