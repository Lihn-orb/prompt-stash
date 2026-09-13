import { apiError, jsonResponse, readJson } from "@/lib/server/http";
import { createPromptSchema } from "@/lib/validation";
import { fallbackMetadata, organizePrompt } from "@/services/ai";
import { createPrompt, getPrompts } from "@/services/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    return jsonResponse(await getPrompts());
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = createPromptSchema.parse(await readJson(request));
    const result = input.aiOrganize
      ? await organizePrompt(input.content)
      : { metadata: fallbackMetadata(input.content), organization: "manual" as const };
    const metadata = { ...result.metadata, title: input.title || result.metadata.title };
    const prompt = await createPrompt(input, metadata);
    return jsonResponse({ success: true, prompt, organization: result.organization }, 201);
  } catch (error) {
    return apiError(error);
  }
}
