import "server-only";
import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import matter from "gray-matter";
import { storageConfig } from "@/lib/server/config";
import { getSupabase } from "@/lib/server/supabase";
import { AppError } from "@/lib/server/errors";
import { MAX_TITLE_LENGTH } from "@/lib/constants";
import { fallbackMetadata } from "@/services/ai";
import type { Prompt, SkillManifest } from "@/types/prompt";

const SKILL_BUCKET = "skills";
const MAX_ZIP_BYTES = 25 * 1024 * 1024;
const MAX_ENTRY_CHARS = 100_000;

interface ExtractedSkill {
  manifest: SkillManifest;
  entryContent: string;
  entryPath: string;
}

function findEntry(zip: JSZip): JSZip.JSZipObject {
  const candidates = Object.values(zip.files).filter(
    (file) => !file.dir && /(^|\/)SKILL\.md$/i.test(file.name),
  );
  if (candidates.length === 0) {
    throw new AppError("The skill package must contain a SKILL.md at the root.", 400);
  }
  candidates.sort((a, b) => a.name.split("/").length - b.name.split("/").length);
  return candidates[0];
}

async function extractSkill(buffer: Buffer): Promise<ExtractedSkill> {
  if (buffer.byteLength > MAX_ZIP_BYTES) {
    throw new AppError("Skill package exceeds the 25 MB limit.", 413);
  }
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new AppError("The uploaded file is not a valid zip archive.", 400);
  }
  const entry = findEntry(zip);
  const raw = await entry.async("string");
  const parsed = matter(raw);
  const front = parsed.data as Record<string, unknown>;
  const nameRaw = front.name ?? "";
  const nestedMetadata =
    front.metadata && typeof front.metadata === "object"
      ? (front.metadata as Record<string, unknown>)
      : null;
  const versionRaw = front.version ?? nestedMetadata?.version;
  const descriptionRaw = front.description ?? "";
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const version = typeof versionRaw === "string" ? versionRaw.trim() : String(versionRaw ?? "").trim();
  const description = typeof descriptionRaw === "string" ? descriptionRaw.trim() : "";
  if (!name) {
    throw new AppError("SKILL.md frontmatter must include a non-empty 'name'.", 400);
  }
  if (name.length > MAX_TITLE_LENGTH) {
    throw new AppError(`Skill name must be at most ${MAX_TITLE_LENGTH} characters.`, 400);
  }
  const body = parsed.content.slice(0, MAX_ENTRY_CHARS);
  return {
    manifest: { name, version: version || "0.0.0", description },
    entryContent: body,
    entryPath: entry.name,
  };
}

function packagePath(ownerId: string, promptId: string): string {
  return `${ownerId}/${promptId}.zip`;
}

export async function createSkill(fileBuffer: Buffer): Promise<Prompt> {
  const { mode, ownerId } = storageConfig();
  if (mode !== "supabase") {
    throw new AppError("Skill uploads require Supabase. Configure SUPABASE_URL first.", 503);
  }
  const extracted = await extractSkill(fileBuffer);
  const supabase = getSupabase();
  const id = randomUUID();
  const path = packagePath(ownerId, id);
  const upload = await supabase.storage
    .from(SKILL_BUCKET)
    .upload(path, fileBuffer, { contentType: "application/zip", upsert: false });
  if (upload.error) {
    throw new AppError(`Failed to store skill package: ${upload.error.message}`);
  }
  const metadata = fallbackMetadata(extracted.entryContent || extracted.manifest.description);
  const now = new Date().toISOString();
  const row: Prompt = {
    id,
    user_id: ownerId,
    title: extracted.manifest.name,
    description: extracted.manifest.description || metadata.description,
    content: extracted.entryContent || extracted.manifest.description || extracted.manifest.name,
    type: "skill",
    category: metadata.category,
    tags: metadata.tags,
    status: "inbox",
    source: "manual",
    source_url: null,
    created_at: now,
    updated_at: now,
    manifest: extracted.manifest,
    package_path: path,
    entry_content: extracted.entryContent,
  };
  const insert = await supabase.from("prompts").insert(row).select("*").single();
  if (insert.error) {
    await supabase.storage.from(SKILL_BUCKET).remove([path]);
    throw new AppError(insert.error.message);
  }
  return insert.data as Prompt;
}

export async function signSkillDownload(id: string): Promise<string> {
  const { mode, ownerId } = storageConfig();
  if (mode !== "supabase") {
    throw new AppError("Skill downloads require Supabase.", 503);
  }
  const supabase = getSupabase();
  const { data: prompt, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("user_id", ownerId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError(error.message);
  if (!prompt || prompt.type !== "skill" || !prompt.package_path) {
    throw new AppError("This skill is no longer available.", 404);
  }
  const signed = await supabase.storage
    .from(SKILL_BUCKET)
    .createSignedUrl(prompt.package_path, 60, { download: `${prompt.title}.zip` });
  if (signed.error || !signed.data) {
    throw new AppError(signed.error?.message ?? "Failed to sign download URL.");
  }
  return signed.data.signedUrl;
}

export async function deleteSkillPackage(prompt: Prompt): Promise<void> {
  if (prompt.type !== "skill" || !prompt.package_path) return;
  const { mode } = storageConfig();
  if (mode !== "supabase") return;
  await getSupabase().storage.from(SKILL_BUCKET).remove([prompt.package_path]);
}
