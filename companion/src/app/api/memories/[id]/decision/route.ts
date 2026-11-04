import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiError,
  isErrorResponse,
  noStore,
  requireSession,
} from "@/app/api/_lib/responses";
import {
  decideMemory,
  MemoryDecisionConflictError,
  MemoryNotFoundError,
  type MemoryDecisionResponse,
} from "@/modules/memory";

export const runtime = "nodejs";

const memoryDecisionSchema = z.object({ accepted: z.boolean() }).strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Send a valid JSON request.");
  }

  const parsed = memoryDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      400,
      "INVALID_MEMORY_DECISION",
      "Send exactly one boolean field named accepted.",
    );
  }

  const { id } = await context.params;
  if (!id) {
    return apiError(400, "INVALID_MEMORY_ID", "Memory ID is required.");
  }

  try {
    const response: MemoryDecisionResponse = decideMemory(
      session.userId,
      id,
      parsed.data.accepted,
    );
    return noStore(NextResponse.json(response));
  } catch (error) {
    if (error instanceof MemoryNotFoundError) {
      return apiError(404, "MEMORY_NOT_FOUND", error.message);
    }
    if (error instanceof MemoryDecisionConflictError) {
      return apiError(409, "MEMORY_ALREADY_DECIDED", error.message);
    }
    throw error;
  }
}
