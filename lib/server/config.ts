import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/server/errors";
import type { StorageMode } from "@/types/prompt";

const LOCAL_OWNER_ID = "11111111-1111-4111-8111-111111111111";

export function storageConfig(): { mode: StorageMode; ownerId: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ownerId = process.env.PROMPT_STASH_OWNER_ID;
  if (url || key) {
    if (!url || !key || !ownerId || !z.uuid().safeParse(ownerId).success) {
      throw new AppError(
        "Complete SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a valid PROMPT_STASH_OWNER_ID.",
      );
    }
    return { mode: "supabase", ownerId };
  }
  if (process.env.VERCEL) {
    throw new AppError(
      "Configure Supabase before deploying. Local storage is only available on a persistent local server.",
      503,
    );
  }
  return { mode: "local", ownerId: LOCAL_OWNER_ID };
}
