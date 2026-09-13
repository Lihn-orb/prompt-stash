import "server-only";
import { metadataSchema } from "@/lib/validation";
import { OpenAICompatibleProvider } from "@/services/ai/openai-compatible";
import type { MetadataProvider } from "@/services/ai/provider";
import type { PromptMetadata } from "@/types/prompt";

export function fallbackMetadata(content: string): PromptMetadata {
  return {
    title: Array.from(content.trim()).slice(0, 30).join(""),
    description: "",
    category: "Other",
    tags: [],
    type: "prompt",
  };
}

function getProvider(): MetadataProvider | null {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  if ((process.env.AI_PROVIDER ?? "openai-compatible") !== "openai-compatible") return null;
  return new OpenAICompatibleProvider({
    apiKey,
    baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.AI_MODEL || "gpt-4o-mini",
  });
}

export async function organizePrompt(content: string): Promise<{
  metadata: PromptMetadata;
  organization: "ai" | "fallback";
}> {
  const fallback = { metadata: fallbackMetadata(content), organization: "fallback" as const };
  const provider = getProvider();
  // Bound external processing cost; long prompts are still saved without alteration.
  if (!provider || content.length > 30_000) return fallback;
  try {
    const metadata = metadataSchema.parse(await provider.extractMetadata(content));
    return { metadata, organization: "ai" };
  } catch {
    return fallback;
  }
}
