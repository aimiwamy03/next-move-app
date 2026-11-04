import { NextResponse } from "next/server";

import { resetRequestSchema } from "@/contracts/api";
import {
  apiError,
  isErrorResponse,
  noStore,
  requireSession,
} from "@/app/api/_lib/responses";
import { resetDemoData } from "@/infrastructure/db/seed";
import { clearSessionCookie } from "@/modules/auth/service";
import { warmConfiguredConversationModels } from "@/modules/model";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== "true") {
    return apiError(404, "NOT_FOUND", "This endpoint is available only in demo mode.");
  }
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Send a valid JSON request.");
  }
  if (!resetRequestSchema.safeParse(body).success) {
    return apiError(400, "RESET_NOT_CONFIRMED", "Confirm the demo reset explicitly.");
  }

  resetDemoData();
  const model = await warmConfiguredConversationModels();
  const response = NextResponse.json({
    reset: true as const,
    sessionInvalidated: true as const,
    modelWarm: model.ok,
    models: model.models,
  });
  response.headers.set("set-cookie", clearSessionCookie());
  return noStore(response);
}
