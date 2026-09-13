import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/server/errors";

const MAX_REQUEST_BYTES = 512_000;

export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new AppError("Content-Type must be application/json.", 415);
  }
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) {
    throw new AppError("Request is too large.", 413);
  }
  if (!request.body) throw new AppError("A JSON body is required.", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new AppError("Request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError("Invalid JSON body.", 400);
  }
}

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export function apiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return jsonResponse(
      {
        success: false,
        error: error.issues
          .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
          .join("; "),
      },
      400,
    );
  }
  if (error instanceof AppError)
    return jsonResponse({ success: false, error: error.message }, error.status);
  console.error("Prompt API request failed.", error instanceof Error ? error.name : "UnknownError");
  return jsonResponse(
    { success: false, error: "Unable to complete the request. Please try again." },
    500,
  );
}
