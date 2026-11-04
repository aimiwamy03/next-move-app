import { NextResponse } from "next/server";

import { pinRequestSchema } from "@/contracts/api";
import {
  createSessionCookie,
  loginWithPin,
  maskPhone,
} from "@/modules/auth/service";
import { apiError, noStore } from "@/app/api/_lib/responses";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Send a valid JSON request.");
  }

  const parsed = pinRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      400,
      "INVALID_PIN_REQUEST",
      "Enter a valid four-digit PIN.",
    );
  }

  const demoMode = process.env.DEMO_MODE === "true";
  const phoneNumber = demoMode
    ? process.env.DEMO_PHONE_E164 ?? "+14155550123"
    : parsed.data.phoneNumber;
  if (!phoneNumber) {
    return apiError(
      400,
      "PHONE_REQUIRED",
      "A phone number is required outside demo mode.",
    );
  }

  const result = loginWithPin(phoneNumber, parsed.data.pin);
  if (result.status === "invalid") {
    return apiError(401, "INVALID_CREDENTIALS", "That PIN was not recognized.");
  }
  if (result.status === "locked") {
    return apiError(
      429,
      "PIN_LOCKED",
      "Too many attempts. Please wait before trying again.",
      { retryAfterSeconds: result.retryAfterSeconds },
    );
  }

  const response = NextResponse.json({
    participant: {
      preferredName: result.session.preferredName,
      maskedPhone: maskPhone(result.session.phoneNumber),
    },
  });
  response.headers.set(
    "set-cookie",
    createSessionCookie(result.token, result.session.expiresAt),
  );
  return noStore(response);
}
