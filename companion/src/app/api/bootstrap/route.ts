import { NextResponse } from "next/server";

import type { BootstrapResponse } from "@/contracts/api";
import {
  isErrorResponse,
  noStore,
  requireSession,
} from "@/app/api/_lib/responses";
import { maskPhone } from "@/modules/auth/service";
import {
  listTaskCards,
  recommendNextTasks,
} from "@/modules/checklist/service";
import { listMessages } from "@/modules/conversation/repository";
import { listMemoryStatuses } from "@/modules/memory";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  const body: BootstrapResponse = {
    participant: {
      preferredName: session.preferredName,
      maskedPhone: maskPhone(session.phoneNumber),
    },
    messages: listMessages(session.userId),
    tasks: listTaskCards(session.userId),
    recommendedTasks: recommendNextTasks(session.userId),
    memoryStatuses: listMemoryStatuses(session.userId),
    features: {
      demoMode: process.env.DEMO_MODE === "true",
      practiceAvailable: true,
      modelProvider: "ollama",
    },
  };
  return noStore(NextResponse.json(body));
}
