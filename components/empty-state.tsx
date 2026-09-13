"use client";

import { Archive, BookOpen, Inbox, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  view,
  filtered,
  onAdd,
  onClear,
}: {
  view: "inbox" | "library" | "archived";
  filtered: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  const Icon = filtered
    ? Search
    : view === "inbox"
      ? Inbox
      : view === "archived"
        ? Archive
        : BookOpen;
  const title = filtered
    ? "No matching prompts."
    : view === "inbox"
      ? "Nothing here yet."
      : view === "archived"
        ? "No archived prompts."
        : "Your reusable prompts will live here.";
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
      <Icon size={36} strokeWidth={1.2} className="mb-5 text-muted" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {!filtered && view === "inbox" && (
        <p className="mt-2 text-sm text-secondary">Paste your first useful prompt.</p>
      )}
      <Button className="mt-6" onClick={filtered ? onClear : onAdd}>
        {filtered ? <X size={14} /> : <Plus size={14} />}
        {filtered ? "Clear filters" : "Add prompt"}
      </Button>
    </div>
  );
}
