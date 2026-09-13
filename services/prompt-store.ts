import { apiPrompts } from "@/services/api-prompts";
import { mockPrompts } from "@/services/mock-prompts";
import type { BackendMode } from "@/lib/runtime";
import type { CreatePromptInput, Prompt, UpdatePromptInput } from "@/types/prompt";

/**
 * A store exposes the reactive surface the WorkspaceProvider binds to. Both the
 * localStorage store and the API store implement it; mutations are awaited so the
 * provider is agnostic to whether they resolve synchronously or over the network.
 */
export interface PromptStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): { prompts: Prompt[]; loading: boolean; error: string | null };
  getServerSnapshot(): { prompts: Prompt[]; loading: boolean; error: string | null };
  reload(): void;
  create(input: CreatePromptInput): Prompt | Promise<Prompt>;
  update(id: string, input: UpdatePromptInput): Prompt | Promise<Prompt>;
  remove(id: string): void | Promise<void>;
}

export function selectStore(mode: BackendMode): PromptStore {
  return mode === "remote" ? apiPrompts : mockPrompts;
}
