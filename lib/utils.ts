import type { Prompt } from "@/types/prompt";
import { ZodError } from "zod";

export function relativeTime(value: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export function fullDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function matchesQuery(prompt: Prompt, query: string): boolean {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [prompt.title, prompt.description, prompt.content, ...prompt.tags]
    .join(" ")
    .toLocaleLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Please check the form fields.";
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export async function copyText(content: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content);
    return;
  }
  const previousFocus = document.activeElement;
  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.style.cssText = "position:fixed;left:-9999px;top:0;";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (previousFocus instanceof HTMLElement) previousFocus.focus();
  if (!copied) throw new Error("Clipboard is unavailable. Select and copy the prompt content.");
}
