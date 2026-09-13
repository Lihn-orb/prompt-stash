"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filter-bar";
import { EmptyState } from "@/components/empty-state";
import { PromptList, CollectionSkeleton } from "@/components/prompt-list";
import { CATEGORIES, PROMPT_TYPES, type Category, type PromptType } from "@/types/prompt";
import { TYPE_LABELS } from "@/lib/constants";
import { matchesQuery } from "@/lib/utils";

export function CollectionView({ view }: { view: "inbox" | "library" }) {
  const { prompts, loading, error, query, setQuery, openAdd, refresh } = useWorkspace();
  const params = useSearchParams();
  const router = useRouter();
  const isLibrary = view === "library";
  const rawCategory = params.get("category") ?? "All";
  const category = CATEGORIES.includes(rawCategory as Category) ? rawCategory : "All";
  const rawType = params.get("type") ?? "";
  const type = PROMPT_TYPES.includes(rawType as PromptType) ? rawType : "";
  const rawStatus = params.get("status") ?? "";
  const status =
    isLibrary && ["library", "tested", "archived"].includes(rawStatus) ? rawStatus : "";
  const tag = params.get("tag") ?? "";
  const isFiltered =
    !!query.trim() || category !== "All" || !!type || (!!status && status !== "archived") || !!tag;

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "All") next.set(key, value);
    else next.delete(key);
    router.replace(`/${view}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const basePrompts = useMemo(
    () =>
      prompts.filter((prompt) => {
        if (!isLibrary) return prompt.status === "inbox";
        if (status) return prompt.status === status;
        return prompt.status === "library" || prompt.status === "tested";
      }),
    [prompts, isLibrary, status],
  );

  const visible = useMemo(
    () =>
      basePrompts
        .filter(
          (prompt) =>
            (category === "All" || prompt.category === category) &&
            (!type || prompt.type === type) &&
            (!tag || prompt.tags.includes(tag)) &&
            matchesQuery(prompt, query),
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [basePrompts, category, type, tag, query],
  );

  const clearFilters = () => {
    setQuery("");
    router.replace(`/${view}${status === "archived" ? "?status=archived" : ""}`, { scroll: false });
  };
  const title =
    status === "archived"
      ? "Archived"
      : tag
        ? `#${tag}`
        : type
          ? `${TYPE_LABELS[type as PromptType]}s`
          : isLibrary
            ? "Library"
            : "Inbox";
  const subtitle =
    status === "archived"
      ? "Prompts you've set aside."
      : tag
        ? "Tagged prompts."
        : isLibrary
          ? "Your reusable, battle-tested prompts."
          : "Fresh captures, newest first.";

  return (
    <div className="enter-content">
      <div className="flex items-end justify-between gap-4 pb-2">
        <div className="min-w-0">
          <h1 className="display-title caret text-[36px]">{title}</h1>
          <p className="mt-2 text-[12px] text-muted">
            <span className="text-accent">&gt;</span> {subtitle}
          </p>
        </div>
        {!loading && (
          <span className="label-caps shrink-0 pb-1 tabular-nums text-muted">
            {String(basePrompts.length).padStart(2, "0")}{" "}
            {basePrompts.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>
      <FilterBar
        category={category}
        type={type}
        status={status}
        tag={tag}
        isLibrary={isLibrary}
        filtered={isFiltered}
        onChange={updateFilter}
        onClear={clearFilters}
      />
      {error ? (
        <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <p role="alert" className="max-w-md text-sm leading-6 text-danger">
            {error}
          </p>
          <Button className="mt-4" onClick={refresh}>
            <RotateCcw size={14} />
            Try again
          </Button>
        </div>
      ) : loading ? (
        <CollectionSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          view={status === "archived" ? "archived" : view}
          filtered={isFiltered}
          onAdd={openAdd}
          onClear={clearFilters}
        />
      ) : (
        <>
          <PromptList prompts={visible} />
          {isFiltered && (
            <p className="mt-6 text-xs text-muted" role="status">
              {visible.length} {visible.length === 1 ? "result" : "results"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
