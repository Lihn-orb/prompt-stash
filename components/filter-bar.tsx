"use client";

import { ChevronDown, X } from "lucide-react";
import { CATEGORIES, PROMPT_TYPES } from "@/types/prompt";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        className="select-control"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export function FilterBar({
  category,
  type,
  status,
  tag,
  isLibrary,
  filtered,
  onChange,
  onClear,
}: {
  category: string;
  type: string;
  status: string;
  tag: string;
  isLibrary: boolean;
  filtered: boolean;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-6 mt-7 space-y-4">
      <div
        className="scrollbar-none flex gap-1 overflow-x-auto border-b-[1.5px] border-ink"
        role="group"
        aria-label="Category"
      >
        {["All", ...CATEGORIES].map((item) => (
          <button
            key={item}
            aria-pressed={category === item}
            onClick={() => onChange("category", item)}
            className={`relative min-h-9 shrink-0 px-3 text-[11.5px] font-medium uppercase tracking-[0.06em] transition-colors max-sm:min-h-11 ${
              category === item
                ? "text-foreground after:absolute after:inset-x-1 after:-bottom-[1.5px] after:h-[2.5px] after:bg-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Filter by type"
            value={type}
            options={[
              { value: "", label: "All types" },
              ...PROMPT_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] })),
            ]}
            onChange={(value) => onChange("type", value)}
          />
          {isLibrary && status !== "archived" && (
            <FilterSelect
              label="Filter by status"
              value={status}
              options={[
                { value: "", label: "All statuses" },
                ...(["library", "tested"] as const).map((value) => ({
                  value,
                  label: STATUS_LABELS[value],
                })),
              ]}
              onChange={(value) => onChange("status", value)}
            />
          )}
          {tag && (
            <Button size="small" variant="ghost" onClick={() => onChange("tag", "")}>
              #{tag}
              <X size={12} />
            </Button>
          )}
          {filtered && (
            <Button size="small" variant="ghost" onClick={onClear}>
              <X size={12} />
              Clear
            </Button>
          )}
        </div>
        <span className="label-caps text-muted">↓ Newest first</span>
      </div>
    </div>
  );
}
