import type { Category, PromptSource, PromptStatus, PromptType } from "@/types/prompt";

export const APP_NAME = "Prompt Stash";
export const PROMPTS_CACHE_KEY = "/api/prompts";
export const MAX_CONTENT_LENGTH = 100_000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_TAGS = 12;
export const MAX_TAG_LENGTH = 40;

export const TYPE_LABELS: Record<PromptType, string> = {
  prompt: "Prompt",
  template: "Template",
  skill: "Skill",
};

export const STATUS_LABELS: Record<PromptStatus, string> = {
  inbox: "Inbox",
  library: "Library",
  tested: "Tested",
  archived: "Archived",
};

export const SOURCE_LABELS: Record<PromptSource, string> = {
  manual: "Manual",
  chatgpt: "ChatGPT",
  claude: "Claude",
  web: "Web",
  other: "Other",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Design: "var(--category-design)",
  Research: "var(--category-research)",
  Coding: "var(--category-coding)",
  Writing: "var(--category-writing)",
  Image: "var(--category-image)",
  Productivity: "var(--category-productivity)",
  Other: "var(--text-muted)",
};
