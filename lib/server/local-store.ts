import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import lockfile from "proper-lockfile";
import { z } from "zod";
import { createMockPrompts } from "@/lib/mock-data";
import { storedPromptSchema } from "@/lib/validation";
import { AppError } from "@/lib/server/errors";
import type { Prompt } from "@/types/prompt";

// Runtime-only private data must never be traced into the deployment bundle.
const filePath = resolve(
  /* turbopackIgnore: true */ process.env.LOCAL_DATA_FILE || ".data/prompts.json",
);

async function writeAtomically(prompts: Prompt[]) {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(prompts, null, 2), { mode: 0o600 });
  await rename(temporaryPath, filePath);
}

// A filesystem lock covers reads and atomic writes across Next.js workers.
export async function withLocalStore<T>(
  ownerId: string,
  operation: (prompts: Prompt[]) => { result: T; changed?: boolean },
): Promise<T> {
  await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
  const release = await lockfile.lock(filePath, {
    realpath: false,
    retries: { retries: 25, minTimeout: 20, maxTimeout: 150 },
    stale: 10_000,
  });
  try {
    let prompts: Prompt[];
    try {
      const raw = await readFile(/* turbopackIgnore: true */ filePath, "utf8");
      prompts = z.array(storedPromptSchema).parse(JSON.parse(raw));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        prompts = process.env.SEED_DEMO_DATA === "false" ? [] : createMockPrompts(ownerId);
        await writeAtomically(prompts);
      } else {
        throw new AppError(
          "Local data could not be read. Check .data/prompts.json; existing data has not been replaced.",
        );
      }
    }
    const { result, changed } = operation(prompts);
    if (changed) await writeAtomically(prompts);
    return result;
  } finally {
    await release();
  }
}
