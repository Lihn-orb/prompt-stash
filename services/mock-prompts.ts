import { z } from "zod";
import { createMockPrompts } from "@/data/mock-prompts";
import { createPromptSchema, storedPromptSchema, updatePromptSchema } from "@/lib/validation";
import { mockOrganize, temporaryTitle } from "@/services/mock-organizer";
import type { CreatePromptInput, Prompt, UpdatePromptInput } from "@/types/prompt";

export const MOCK_STORAGE_KEY = "prompt-stash.frontend.v1";
const storedCollectionSchema = z.object({
  version: z.literal(1),
  prompts: z.array(storedPromptSchema),
});
const initialSnapshot = { prompts: [] as Prompt[], loading: true, error: null as string | null };
let snapshot = initialSnapshot;
let initialized = false;
const listeners = new Set<() => void>();

function publish(prompts: Prompt[], error: string | null = null) {
  snapshot = { prompts, error, loading: false };
  listeners.forEach((listener) => listener());
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const saved = localStorage.getItem(MOCK_STORAGE_KEY);
    const prompts =
      saved !== null
        ? storedCollectionSchema.parse(JSON.parse(saved)).prompts
        : createMockPrompts();
    if (saved === null)
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify({ version: 1, prompts }));
    publish(prompts);
  } catch {
    publish(
      [],
      "Browser data could not be loaded. Check that local storage is available, then try again. Existing data has not been replaced.",
    );
  }
}

function commit(prompts: Prompt[]) {
  if (snapshot.loading || snapshot.error)
    throw new Error("The workspace is not ready. Please try again.");
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify({ version: 1, prompts }));
  } catch {
    throw new Error("Changes could not be saved in this browser. Free up storage and try again.");
  }
  publish(prompts.sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

function find(id: string): Prompt {
  const prompt = snapshot.prompts.find((item) => item.id === id);
  if (!prompt) throw new Error("This prompt is no longer available.");
  return prompt;
}

function onStorage(event: StorageEvent) {
  if (event.storageArea !== localStorage || (event.key !== MOCK_STORAGE_KEY && event.key !== null))
    return;
  initialized = false;
  initialize();
}

export const mockPrompts = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) window.addEventListener("storage", onStorage);
    initialize();
    return () => {
      listeners.delete(listener);
      if (!listeners.size) window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => initialSnapshot,
  reload() {
    initialized = false;
    initialize();
  },
  create(input: CreatePromptInput): Prompt {
    const parsed = createPromptSchema.parse(input);
    const metadata = parsed.aiOrganize
      ? mockOrganize(parsed.content)
      : {
          title: temporaryTitle(parsed.content),
          description: "",
          category: "Other" as const,
          tags: [],
          type: "prompt" as const,
        };
    const date = new Date().toISOString();
    const prompt: Prompt = {
      ...metadata,
      id: crypto.randomUUID(),
      user_id: null,
      title: parsed.title || metadata.title,
      type: parsed.type ?? metadata.type,
      content: parsed.content,
      status: "inbox",
      source: parsed.source,
      source_url: parsed.sourceUrl || null,
      created_at: date,
      updated_at: date,
      manifest: null,
      package_path: null,
      entry_content: null,
    };
    commit([prompt, ...snapshot.prompts]);
    return prompt;
  },
  update(id: string, input: UpdatePromptInput): Prompt {
    const prompt = {
      ...find(id),
      ...updatePromptSchema.parse(input),
      updated_at: new Date().toISOString(),
    };
    commit(snapshot.prompts.map((item) => (item.id === id ? prompt : item)));
    return prompt;
  },
  remove(id: string) {
    find(id);
    commit(snapshot.prompts.filter((item) => item.id !== id));
  },
};
