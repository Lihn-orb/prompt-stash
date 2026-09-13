import { NextResponse } from "next/server";
import { apiError } from "@/lib/server/http";
import { promptIdSchema } from "@/lib/validation";
import { signSkillDownload } from "@/services/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const id = promptIdSchema.parse((await context.params).id);
    const url = await signSkillDownload(id);
    return NextResponse.redirect(url, 302);
  } catch (error) {
    return apiError(error);
  }
}
