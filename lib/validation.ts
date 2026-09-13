import { z } from "zod";
import { CATEGORIES, PROMPT_SOURCES, PROMPT_STATUSES, PROMPT_TYPES } from "@/types/prompt";
import { MAX_CONTENT_LENGTH, MAX_TAG_LENGTH, MAX_TAGS, MAX_TITLE_LENGTH } from "@/lib/constants";

const contentSchema = z
  .string()
  .max(MAX_CONTENT_LENGTH)
  .refine((value) => value.trim().length > 0, "Prompt content is required.");
const titleSchema = z.string().trim().min(1, "Title is required.").max(MAX_TITLE_LENGTH);
const sourceUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Source URL must be a valid http or https URL.");
const tagsSchema = z
  .array(z.string().trim().min(1).max(MAX_TAG_LENGTH))
  .max(MAX_TAGS)
  .transform((tags) => [...new Set(tags)]);

export const metadataSchema = z
  .object({
    title: titleSchema,
    description: z.string().trim().max(1000),
    category: z.enum(CATEGORIES),
    tags: tagsSchema,
    type: z.enum(PROMPT_TYPES),
  })
  .strict();

export const createPromptSchema = z
  .object({
    content: contentSchema,
    title: z.string().trim().max(MAX_TITLE_LENGTH).optional(),
    type: z.enum(["prompt", "template"]).optional(),
    source: z.preprocess(
      (value) => (typeof value === "string" ? value.toLowerCase() : value),
      z.enum(PROMPT_SOURCES).default("manual"),
    ),
    sourceUrl: sourceUrlSchema.optional(),
    aiOrganize: z.boolean().default(true),
  })
  .strict();

export const updatePromptSchema = z
  .object({
    content: contentSchema.optional(),
    title: titleSchema.optional(),
    description: z.string().trim().max(1000).optional(),
    category: z.enum(CATEGORIES).optional(),
    tags: tagsSchema.optional(),
    type: z.enum(PROMPT_TYPES).optional(),
    status: z.enum(PROMPT_STATUSES).optional(),
    source: z.enum(PROMPT_SOURCES).optional(),
    source_url: sourceUrlSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export const promptIdSchema = z.uuid();

export const skillManifestSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
    version: z.string().trim().min(1).max(64),
    description: z.string().trim().max(1000),
  })
  .strict();

export const storedPromptSchema = metadataSchema.extend({
  id: z.uuid(),
  user_id: z.uuid().nullable(),
  content: contentSchema,
  status: z.enum(PROMPT_STATUSES),
  source: z.enum(PROMPT_SOURCES),
  source_url: sourceUrlSchema.nullable(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
  manifest: skillManifestSchema.nullable().default(null),
  package_path: z.string().nullable().default(null),
  entry_content: z.string().nullable().default(null),
});
