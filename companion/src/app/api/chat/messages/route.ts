import { NextResponse } from "next/server";

import { chatRequestSchema } from "@/contracts/api";
import {
  apiError,
  isErrorResponse,
  noStore,
  requireSession,
} from "@/app/api/_lib/responses";
import { processChat } from "@/modules/conversation/orchestrator";
import { ConversationConflictError } from "@/modules/conversation/repository";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Send a valid JSON request.");
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      400,
      "INVALID_CHAT_REQUEST",
      "Send a message between 1 and 2,000 characters with a new message ID.",
    );
  }

  try {
    return noStore(
      NextResponse.json(
        await processChat(session.userId, parsed.data),
      ),
    );
  } catch (error) {
    if (error instanceof ConversationConflictError) {
      return apiError(409, "MESSAGE_ID_CONFLICT", error.message);
    }
    throw error;
  }
}
