export const CATEGORIES = [
  "Design",
  "Research",
  "Coding",
  "Writing",
  "Image",
  "Productivity",
  "Other",
] as const;

export const PROMPT_TYPES = ["prompt", "template", "skill"] as const;
export const PROMPT_STATUSES = ["inbox", "library", "tested", "archived"] as const;
export const PROMPT_SOURCES = ["manual", "chatgpt", "claude", "web", "other"] as const;

export type Category = (typeof CATEGORIES)[number];
export type PromptType = (typeof PROMPT_TYPES)[number];
export type PromptStatus = (typeof PROMPT_STATUSES)[number];
export type PromptSource = (typeof PROMPT_SOURCES)[number];
export type StorageMode = "local" | "supabase";

export interface PromptMetadata {
  title: string;
  description: string;
  category: Category;
  tags: string[];
  type: PromptType;
}

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
}

export interface Prompt extends PromptMetadata {
  id: string;
  user_id: string | null;
  content: string;
  status: PromptStatus;
  source: PromptSource;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  manifest: SkillManifest | null;
  package_path: string | null;
  entry_content: string | null;
}

export interface CreatePromptInput {
  content: string;
  title?: string;
  type?: "prompt" | "template";
  source?: PromptSource;
  sourceUrl?: string;
  aiOrganize?: boolean;
}

export type UpdatePromptInput = Partial<
  PromptMetadata & {
    content: string;
    status: PromptStatus;
    source: PromptSource;
    source_url: string | null;
  }
>;

export interface PromptCollection {
  prompts: Prompt[];
  storage: StorageMode;
}

export interface SavePromptResult {
  prompt: Prompt;
  organization: "ai" | "fallback" | "manual";
}
