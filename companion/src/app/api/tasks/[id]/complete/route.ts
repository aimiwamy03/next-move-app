import { NextResponse } from "next/server";

import {
  apiError,
  isErrorResponse,
  noStore,
  requireSession,
} from "@/app/api/_lib/responses";
import {
  completeTask,
  TaskNotEligibleError,
  TaskNotFoundError,
} from "@/modules/checklist/service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;
  const { id } = await context.params;

  try {
    return noStore(NextResponse.json(completeTask(session.userId, id)));
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return apiError(404, "TASK_NOT_FOUND", error.message);
    }
    if (error instanceof TaskNotEligibleError) {
      return apiError(409, "TASK_BLOCKED", error.message);
    }
    throw error;
  }
}
