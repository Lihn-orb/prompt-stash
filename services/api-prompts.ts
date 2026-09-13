import type { CreatePromptInput, Prompt, UpdatePromptInput } from "@/types/prompt";

/**
 * API-backed data store. Mirrors the `mockPrompts` surface exactly
 * (subscribe / getSnapshot / getServerSnapshot / reload / create / update / remove)
 * so the WorkspaceProvider can swap stores without any component changes.
 *
 * Reads and writes go through the same-origin HTTP API, which resolves to Supabase
 * (or the server file store) on the server. Mutations return the affected prompt and
 * then refresh the list so every subscriber re-renders from the source of truth.
 */

type Snapshot = { prompts: Prompt[]; loading: boolean; error: string | null };

const initialSnapshot: Snapshot = { prompts: [], loading: true, error: null };
let snapshot = initialSnapshot;
let started = false;
const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      (payload && typeof payload.error === "string" && payload.error) ||
        "The request could not be completed. Please try again.",
    );
  }
  return payload as T;
}

async function load() {
  try {
    const prompts = await request<Prompt[]>("/api/prompts");
    emit({ prompts, loading: false, error: null });
  } catch (error) {
    emit({
      prompts: [],
      loading: false,
      error: error instanceof Error ? error.message : "Unable to load your prompts.",
    });
  }
}

export const apiPrompts = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!started) {
      started = true;
      void load();
    }
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => initialSnapshot,
  reload() {
    void load();
  },
  async create(input: CreatePromptInput): Promise<Prompt> {
    const { prompt } = await request<{ prompt: Prompt }>("/api/prompts", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await load();
    return prompt;
  },
  async update(id: string, input: UpdatePromptInput): Promise<Prompt> {
    const { prompt } = await request<{ prompt: Prompt }>(`/api/prompts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    await load();
    return prompt;
  },
  async remove(id: string): Promise<void> {
    await request<{ success: true }>(`/api/prompts/${id}`, { method: "DELETE" });
    await load();
  },
};
