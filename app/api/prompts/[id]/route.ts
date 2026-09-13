import { apiError, jsonResponse, readJson } from "@/lib/server/http";
import { promptIdSchema, updatePromptSchema } from "@/lib/validation";
import { deletePrompt, getPromptById, updatePrompt } from "@/services/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = promptIdSchema.parse((await context.params).id);
    return jsonResponse({ prompt: await getPromptById(id) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const id = promptIdSchema.parse((await context.params).id);
    const input = updatePromptSchema.parse(await readJson(request));
    return jsonResponse({ prompt: await updatePrompt(id, input) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = promptIdSchema.parse((await context.params).id);
    await deletePrompt(id);
    return jsonResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
