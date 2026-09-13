"use client";

import Link from "next/link";
import {
  AlignLeft,
  Check,
  Code2,
  Copy,
  FileText,
  Image,
  Layers3,
  PenTool,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SOURCE_LABELS } from "@/lib/constants";
import { copyText, errorMessage, fullDate, relativeTime } from "@/lib/utils";
import type { Prompt } from "@/types/prompt";
import { PromptMenu } from "@/components/prompt-menu";
import { Button, Hint } from "@/components/ui/button";

const categoryIcons = {
  Design: PenTool,
  Research: Search,
  Coding: Code2,
  Writing: AlignLeft,
  Image,
  Productivity: Layers3,
  Other: FileText,
};

export function CopyButton({ content, compact = false }: { content: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );
  const onCopy = async () => {
    try {
      await copyText(content);
      setCopied(true);
      toast.success("Copied \u2713");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  return (
    <Hint label={copied ? "Copied" : "Copy prompt"}>
      <Button
        onClick={onCopy}
        size={compact ? "icon" : "default"}
        variant={compact ? "ghost" : "primary"}
        className={compact ? "relative z-10 text-secondary" : ""}
        aria-label="Copy prompt"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {!compact && (copied ? "Copied" : "Copy")}
      </Button>
    </Hint>
  );
}

export function PromptCard({ prompt }: { prompt: Prompt }) {
  const CategoryIcon = categoryIcons[prompt.category];
  return (
    <article data-testid="prompt-card" className="prompt-card group">
      <div className="flex items-center justify-between px-5 pt-4">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-foreground">
          <CategoryIcon size={13} strokeWidth={2} />
          {prompt.category}
        </span>
        <div className="relative z-10 flex items-center gap-1">
          {prompt.status === "tested" && (
            <Hint label="Tested">
              <span
                tabIndex={0}
                className="label-caps rounded-[3px] bg-ink px-1.5 py-0.5 text-on-action"
              >
                OK
              </span>
            </Hint>
          )}
          <PromptMenu prompt={prompt} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-3 pt-3">
        <h2 className="text-[16px] font-bold leading-[1.25] tracking-[-0.02em]">
          <Link
            href={`/prompts/${prompt.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[8px]"
            aria-label={prompt.title}
          >
            {prompt.title}
          </Link>
        </h2>
        <p className="prompt-excerpt mt-2 text-[12.5px] leading-5 text-secondary">
          {(prompt.description || prompt.content).trim()}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-chip mono max-w-full [overflow-wrap:anywhere]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <footer className="mx-5 flex min-h-13 items-center justify-between gap-2 border-t border-border-subtle py-2.5">
        <div className="label-caps flex min-w-0 items-center gap-1.5 text-muted">
          <span>{SOURCE_LABELS[prompt.source]}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={prompt.created_at} title={fullDate(prompt.created_at)}>
            {relativeTime(prompt.created_at)}
          </time>
        </div>
        <CopyButton content={prompt.content} compact />
      </footer>
    </article>
  );
}
