import "server-only";
import { randomUUID } from "node:crypto";
import { storageConfig } from "@/lib/server/config";
import { withLocalStore } from "@/lib/server/local-store";
import { getSupabase } from "@/lib/server/supabase";
import { AppError } from "@/lib/server/errors";
import type { CreatePromptInput, Prompt, PromptMetadata, UpdatePromptInput } from "@/types/prompt";

/**
 * Server-side data-access layer for the dormant HTTP API (`app/api/prompts`).
 *
 * This is the single seam for persistence: it already speaks both localStorage-on-disk
 * (dev) and Supabase (deploy). The browser UI currently runs entirely client-side
 * against `services/mock-prompts.ts`; when we turn the API back on next round, only the
 * bodies here change, not the route handlers or the UI.
 */

function buildPrompt(input: CreatePromptInput, metadata: PromptMetadata, ownerId: string): Prompt {
  const date = new Date().toISOString();
  return {
    ...metadata,
    id: randomUUID(),
    user_id: ownerId,
    title: input.title || metadata.title,
    content: input.content,
    status: "inbox",
    source: input.source ?? "manual",
    source_url: input.sourceUrl || null,
    created_at: date,
    updated_at: date,
    manifest: null,
    package_path: null,
    entry_content: null,
  };
}

export async function getPrompts(): Promise<Prompt[]> {
  const { mode, ownerId } = storageConfig();
  if (mode === "supabase") {
    const { data, error } = await getSupabase()
      .from("prompts")
      .select("*")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError(error.message);
    return (data ?? []) as Prompt[];
  }
  return withLocalStore(ownerId, (prompts) => ({
    result: [...prompts].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  }));
}

export async function getPromptById(id: string): Promise<Prompt | null> {
  const { mode, ownerId } = storageConfig();
  if (mode === "supabase") {
    const { data, error } = await getSupabase()
      .from("prompts")
      .select("*")
      .eq("user_id", ownerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new AppError(error.message);
    return (data as Prompt | null) ?? null;
  }
  return withLocalStore(ownerId, (prompts) => ({
    result: prompts.find((prompt) => prompt.id === id) ?? null,
  }));
}

export async function createPrompt(
  input: CreatePromptInput,
  metadata: PromptMetadata,
): Promise<Prompt> {
  const { mode, ownerId } = storageConfig();
  const prompt = buildPrompt(input, metadata, ownerId);
  if (mode === "supabase") {
    const { data, error } = await getSupabase().from("prompts").insert(prompt).select("*").single();
    if (error) throw new AppError(error.message);
    return data as Prompt;
  }
  return withLocalStore(ownerId, (prompts) => {
    prompts.push(prompt);
    return { result: prompt, changed: true };
  });
}

export async function updatePrompt(id: string, input: UpdatePromptInput): Promise<Prompt> {
  const { mode, ownerId } = storageConfig();
  const patch = { ...input, updated_at: new Date().toISOString() };
  if (mode === "supabase") {
    const { data, error } = await getSupabase()
      .from("prompts")
      .update(patch)
      .eq("user_id", ownerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new AppError(error.message);
    return data as Prompt;
  }
  return withLocalStore(ownerId, (prompts) => {
    const index = prompts.findIndex((prompt) => prompt.id === id);
    if (index < 0) throw new AppError("This prompt is no longer available.", 404);
    prompts[index] = { ...prompts[index], ...patch };
    return { result: prompts[index], changed: true };
  });
}

export async function deletePrompt(id: string): Promise<void> {
  const { mode, ownerId } = storageConfig();
  if (mode === "supabase") {
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from("prompts")
      .select("package_path,type")
      .eq("user_id", ownerId)
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase
      .from("prompts")
      .delete()
      .eq("user_id", ownerId)
      .eq("id", id);
    if (error) throw new AppError(error.message);
    if (existing?.type === "skill" && existing.package_path) {
      await supabase.storage.from("skills").remove([existing.package_path]);
    }
    return;
  }
  await withLocalStore(ownerId, (prompts) => {
    const index = prompts.findIndex((prompt) => prompt.id === id);
    if (index < 0) throw new AppError("This prompt is no longer available.", 404);
    prompts.splice(index, 1);
    return { result: undefined, changed: true };
  });
}
