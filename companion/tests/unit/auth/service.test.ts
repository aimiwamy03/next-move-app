import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST as submitPin } from "@/app/api/auth/pin/route";
import { closeDatabase, getDatabase } from "@/infrastructure/db/client";
import { DEMO_USER_ID, seedDemoData } from "@/infrastructure/db/seed";
import {
  createSessionCookie,
  loginWithPin,
} from "@/modules/auth/service";

const DEMO_PHONE = "+14155550123";

describe("PIN authentication privacy controls", () => {
  let databaseDirectory: string;
  const originalEnvironment = new Map<string, string | undefined>();
  const environmentKeys = [
    "COOKIE_SECURE",
    "DATABASE_PATH",
    "DEMO_MODE",
    "DEMO_PHONE_E164",
    "SESSION_TTL_MINUTES",
  ];

  beforeEach(() => {
    closeDatabase();
    for (const key of environmentKeys) {
      originalEnvironment.set(key, process.env[key]);
    }
    databaseDirectory = mkdtempSync(join(tmpdir(), "mindful-reentry-auth-"));
    process.env.DATABASE_PATH = join(databaseDirectory, "test.sqlite");
    process.env.DEMO_MODE = "true";
    process.env.DEMO_PHONE_E164 = DEMO_PHONE;
    delete process.env.SESSION_TTL_MINUTES;
    seedDemoData({ phoneNumber: DEMO_PHONE, pin: "1937" });
  });

  afterEach(() => {
    closeDatabase();
    for (const key of environmentKeys) {
      const original = originalEnvironment.get(key);
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    }
    originalEnvironment.clear();
    rmSync(databaseDirectory, { force: true, recursive: true });
  });

  it("starts a fresh attempt window after an expired lockout", () => {
    getDatabase().prepare(`
      UPDATE pin_credentials
      SET failed_attempts = 5, locked_until = ?
      WHERE user_id = ?
    `).run(new Date(Date.now() - 60_000).toISOString(), DEMO_USER_ID);

    expect(loginWithPin(DEMO_PHONE, "0000")).toEqual({ status: "invalid" });
    expect(
      getDatabase().prepare(`
        SELECT failed_attempts, locked_until
        FROM pin_credentials
        WHERE user_id = ?
      `).get(DEMO_USER_ID),
    ).toEqual({ failed_attempts: 1, locked_until: null });
  });

  it("uses a 60-minute session when no TTL is configured", () => {
    const startedAt = Date.now();
    const result = loginWithPin(DEMO_PHONE, "1937");

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    const lifetime = new Date(result.session.expiresAt).getTime() - startedAt;
    expect(lifetime).toBeGreaterThanOrEqual(59 * 60_000);
    expect(lifetime).toBeLessThanOrEqual(61 * 60_000);
  });

  it("lets the demo submit only a PIN while production still requires a phone", async () => {
    const demoResponse = await submitPin(
      new Request("http://localhost/api/auth/pin", {
        body: JSON.stringify({ pin: "1937" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    expect(demoResponse.status).toBe(200);

    process.env.DEMO_MODE = "false";
    const productionResponse = await submitPin(
      new Request("http://localhost/api/auth/pin", {
        body: JSON.stringify({ pin: "1937" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    expect(productionResponse.status).toBe(400);
    await expect(productionResponse.json()).resolves.toMatchObject({
      error: { code: "PHONE_REQUIRED" },
    });
  });

  it("supports explicit local HTTP and deployed HTTPS cookie modes", () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    process.env.COOKIE_SECURE = "false";
    expect(createSessionCookie("token", expiresAt)).not.toContain("; Secure");

    process.env.COOKIE_SECURE = "true";
    expect(createSessionCookie("token", expiresAt)).toContain("; Secure");
  });
});
