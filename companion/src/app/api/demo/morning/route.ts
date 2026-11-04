import { NextResponse } from "next/server";

import {
  apiError,
  isErrorResponse,
  noStore,
  requireSession,
} from "@/app/api/_lib/responses";
import { createMorningCheckIn } from "@/modules/conversation/orchestrator";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== "true") {
    return apiError(404, "NOT_FOUND", "This endpoint is available only in demo mode.");
  }
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;
  return noStore(
    NextResponse.json(
      createMorningCheckIn(session.userId, session.timezone),
    ),
  );
}
