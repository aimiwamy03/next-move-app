import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { getDatabase, withImmediateTransaction } from "@/infrastructure/db/client";

export const SESSION_COOKIE_NAME = "mindful_reentry_session";
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

type CredentialRow = {
  user_id: string;
  preferred_name: string;
  phone_e164: string;
  timezone: string;
  pin_hash: string;
  salt: string;
  failed_attempts: number;
  locked_until: string | null;
};

type SessionRow = {
  session_id: string;
  user_id: string;
  preferred_name: string;
  phone_e164: string;
  timezone: string;
  expires_at: string;
};

export type AuthenticatedSession = {
  sessionId: string;
  userId: string;
  preferredName: string;
  phoneNumber: string;
  timezone: string;
  expiresAt: string;
};

export type LoginResult =
  | { status: "success"; token: string; session: AuthenticatedSession }
  | { status: "invalid" }
  | { status: "locked"; retryAfterSeconds: number };

function digestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === SESSION_COOKIE_NAME) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return null;
}

function safePinComparison(pin: string, salt: string, expectedHex: string): boolean {
  const actual = scryptSync(pin, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function ttlMinutes(): number {
  const configured = Number(process.env.SESSION_TTL_MINUTES ?? "60");
  return Number.isFinite(configured) && configured > 0 ? configured : 60;
}

function useSecureSessionCookie(): boolean {
  const configured = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `***-${digits.slice(-4)}`;
}

export function createSessionCookie(token: string, expiresAt: string): string {
  const secure = useSecureSessionCookie() ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Expires=${new Date(expiresAt).toUTCString()}${secure}`;
}

export function clearSessionCookie(): string {
  const secure = useSecureSessionCookie() ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function loginWithPin(phoneNumber: string, pin: string): LoginResult {
  const db = getDatabase();
  const credential = db.prepare(`
    SELECT
      u.id AS user_id,
      u.preferred_name,
      u.phone_e164,
      u.timezone,
      p.pin_hash,
      p.salt,
      p.failed_attempts,
      p.locked_until
    FROM users u
    JOIN pin_credentials p ON p.user_id = u.id
    WHERE u.phone_e164 = ?
  `).get(phoneNumber) as CredentialRow | undefined;

  if (!credential) {
    scryptSync(pin, "missing-demo-credential", 64);
    return { status: "invalid" };
  }

  const now = new Date();
  if (credential.locked_until) {
    const lockedUntil = new Date(credential.locked_until);
    if (lockedUntil > now) {
      return {
        status: "locked",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((lockedUntil.getTime() - now.getTime()) / 1_000),
        ),
      };
    }

    // An expired lock starts a fresh attempt window. Without this reset, the
    // first typo after waiting would immediately lock the participant again.
    db.prepare(`
      UPDATE pin_credentials
      SET failed_attempts = 0, locked_until = NULL, updated_at = ?
      WHERE user_id = ? AND locked_until IS NOT NULL AND locked_until <= ?
    `).run(now.toISOString(), credential.user_id, now.toISOString());
    credential.failed_attempts = 0;
    credential.locked_until = null;
  }

  if (!safePinComparison(pin, credential.salt, credential.pin_hash)) {
    return withImmediateTransaction((transaction) => {
      const fresh = transaction.prepare(`
        SELECT failed_attempts FROM pin_credentials WHERE user_id = ?
      `).get(credential.user_id) as { failed_attempts: number };
      const attempts = fresh.failed_attempts + 1;
      const lockedUntil =
        attempts >= MAX_PIN_ATTEMPTS
          ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000).toISOString()
          : null;
      transaction.prepare(`
        UPDATE pin_credentials
        SET failed_attempts = ?, locked_until = ?, updated_at = ?
        WHERE user_id = ?
      `).run(attempts, lockedUntil, now.toISOString(), credential.user_id);

      if (lockedUntil) {
        return {
          status: "locked" as const,
          retryAfterSeconds: LOCKOUT_MINUTES * 60,
        };
      }
      return { status: "invalid" as const };
    });
  }

  return withImmediateTransaction((transaction) => {
    const token = randomBytes(32).toString("base64url");
    const sessionId = randomUUID();
    const createdAt = now.toISOString();
    const expiresAt = new Date(
      now.getTime() + ttlMinutes() * 60_000,
    ).toISOString();

    transaction.prepare(`
      UPDATE pin_credentials
      SET failed_attempts = 0, locked_until = NULL, updated_at = ?
      WHERE user_id = ?
    `).run(createdAt, credential.user_id);
    transaction.prepare(`
      DELETE FROM sessions WHERE user_id = ? AND expires_at <= ?
    `).run(credential.user_id, createdAt);
    transaction.prepare(`
      INSERT INTO sessions
        (id, user_id, token_hash, expires_at, last_used_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      credential.user_id,
      digestToken(token),
      expiresAt,
      createdAt,
      createdAt,
    );

    return {
      status: "success" as const,
      token,
      session: {
        sessionId,
        userId: credential.user_id,
        preferredName: credential.preferred_name,
        phoneNumber: credential.phone_e164,
        timezone: credential.timezone,
        expiresAt,
      },
    };
  });
}

export function authenticateRequest(
  request: Request,
): AuthenticatedSession | null {
  const token = cookieToken(request);
  if (!token) return null;

  const now = new Date().toISOString();
  const db = getDatabase();
  const row = db.prepare(`
    SELECT
      s.id AS session_id,
      s.user_id,
      s.expires_at,
      u.preferred_name,
      u.phone_e164,
      u.timezone
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(digestToken(token), now) as SessionRow | undefined;

  if (!row) return null;
  db.prepare("UPDATE sessions SET last_used_at = ? WHERE id = ?").run(
    now,
    row.session_id,
  );

  return {
    sessionId: row.session_id,
    userId: row.user_id,
    preferredName: row.preferred_name,
    phoneNumber: row.phone_e164,
    timezone: row.timezone,
    expiresAt: row.expires_at,
  };
}

export function logoutRequest(request: Request): void {
  const token = cookieToken(request);
  if (!token) return;
  getDatabase()
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .run(digestToken(token));
}
