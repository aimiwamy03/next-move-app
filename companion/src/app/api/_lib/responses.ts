import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import type { ApiError } from "@/contracts/api";
import {
  authenticateRequest,
  type AuthenticatedSession,
} from "@/modules/auth/service";

export function apiError(
  status: number,
  code: string,
  message: string,
  options: { requestId?: string; retryAfterSeconds?: number } = {},
): NextResponse<ApiError> {
  const body: ApiError = {
    error: {
      code,
      message,
      requestId: options.requestId ?? randomUUID(),
      ...(options.retryAfterSeconds !== undefined
        ? { retryAfterSeconds: options.retryAfterSeconds }
        : {}),
    },
  };
  return noStore(NextResponse.json(body, { status }));
}

export function noStore<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export function requireSession(
  request: Request,
): AuthenticatedSession | NextResponse<ApiError> {
  return (
    authenticateRequest(request) ??
    apiError(401, "UNAUTHENTICATED", "Enter the demo PIN to continue.")
  );
}

export function isErrorResponse(
  value: AuthenticatedSession | NextResponse<ApiError>,
): value is NextResponse<ApiError> {
  return value instanceof NextResponse;
}
