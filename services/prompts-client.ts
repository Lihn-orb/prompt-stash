import { mockPrompts } from "@/services/mock-prompts";
import type { CreatePromptInput, Prompt, UpdatePromptInput } from "@/types/prompt";

/**
 * Client-side data-access facade used by the browser UI.
 *
 * Components subscribe to the reactive `mockPrompts` store for live rendering, but any
 * imperative read/write should call through this async CRUD surface. It mirrors the
 * server API in `services/prompts.ts`, so next round we can point these functions at
 * Supabase (or the re-enabled HTTP API) without touching component code.
 */

function readSnapshot(): Prompt[] {
  const { prompts, loading, error } = mockPrompts.getSnapshot();
  if (loading) throw new Error("The workspace is still loading. Please try again.");
  if (error) throw new Error(error);
  return prompts;
}

export async function getPrompts(): Promise<Prompt[]> {
  return readSnapshot();
}

export async function getPromptById(id: string): Promise<Prompt | null> {
  return readSnapshot().find((prompt) => prompt.id === id) ?? null;
}

export async function createPrompt(input: CreatePromptInput): Promise<Prompt> {
  return mockPrompts.create(input);
}

export async function updatePrompt(id: string, input: UpdatePromptInput): Promise<Prompt> {
  return mockPrompts.update(id, input);
}

export async function deletePrompt(id: string): Promise<void> {
  mockPrompts.remove(id);
}
