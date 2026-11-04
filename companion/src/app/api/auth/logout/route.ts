import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  logoutRequest,
} from "@/modules/auth/service";
import { noStore } from "@/app/api/_lib/responses";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  logoutRequest(request);
  const response = NextResponse.json({ loggedOut: true });
  response.headers.set("set-cookie", clearSessionCookie());
  return noStore(response);
}
