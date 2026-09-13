import { NextResponse } from "next/server";
import { apiError, jsonResponse } from "@/lib/server/http";
import { AppError } from "@/lib/server/errors";
import { createSkill } from "@/services/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

async function readBuffer(request: Request): Promise<Buffer> {
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_UPLOAD_BYTES) {
    throw new AppError("Skill package exceeds the 25 MB limit.", 413);
  }
  if (contentType.startsWith("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("package") ?? form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("Attach the skill zip under the field name 'package'.", 400);
    }
    return Buffer.from(await file.arrayBuffer());
  }
  if (contentType === "application/zip" || contentType === "application/octet-stream") {
    return Buffer.from(await request.arrayBuffer());
  }
  throw new AppError(
    "Send multipart/form-data with a 'package' field or a raw application/zip body.",
    415,
  );
}

export async function POST(request: Request) {
  try {
    const buffer = await readBuffer(request);
    if (buffer.byteLength === 0) throw new AppError("The skill package is empty.", 400);
    const prompt = await createSkill(buffer);
    return jsonResponse({ success: true, prompt }, 201);
  } catch (error) {
    return apiError(error);
  }
}

export function GET() {
  return NextResponse.json(
    { success: false, error: "Skills are listed via GET /api/prompts." },
    { status: 405 },
  );
}
