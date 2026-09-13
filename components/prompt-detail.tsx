"use client";

import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Download,
  Inbox,
  Package,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/prompt-card";
import { TemplateFiller } from "@/components/template-filler";
import { useWorkspace } from "@/components/workspace-provider";
import { CATEGORY_COLORS, SOURCE_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";
import { fullDate } from "@/lib/utils";
import type { Prompt } from "@/types/prompt";

export function PromptDetail({ id }: { id: string }) {
  const { prompts, loading, error, refresh, openEdit, setDeleteTarget, changeStatus } =
    useWorkspace();
  const prompt = prompts.find((item) => item.id === id);
  if (loading)
    return (
      <div role="status" aria-label="Loading prompt" className="animate-pulse">
        <div className="h-8 w-1/2 rounded bg-surface-raised" />
        <div className="mt-10 h-80 rounded-lg bg-surface" />
      </div>
    );
  if (error || !prompt)
    return (
      <div className="py-24 text-center">
        <h1 className="text-lg font-medium">Unable to open prompt</h1>
        <p role="alert" className="mt-2 text-sm text-secondary">
          {error || "This prompt may have been deleted."}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/inbox" className="inline-flex items-center gap-2 text-sm text-accent">
            <ArrowLeft size={14} />
            Back to Inbox
          </Link>
          <Button onClick={refresh}>
            <RotateCcw size={14} />
            Try again
          </Button>
        </div>
      </div>
    );

  return (
    <div className="enter-content">
      <Link
        href={
          prompt.status === "inbox"
            ? "/inbox"
            : prompt.status === "archived"
              ? "/library?status=archived"
              : "/library"
        }
        className="mb-8 inline-flex items-center gap-2 text-xs text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {prompt.status === "inbox"
          ? "Inbox"
          : prompt.status === "archived"
            ? "Archived"
            : "Library"}
      </Link>
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row">
        <div className="min-w-0 w-full max-w-[750px] flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-secondary">
              <span
                className="cat-dot"
                style={{ background: CATEGORY_COLORS[prompt.category] }}
                aria-hidden="true"
              />
              {prompt.category}
            </span>
            <span className="text-muted">/</span>
            <span className="text-muted">{TYPE_LABELS[prompt.type]}</span>
          </div>
          <h1 className="display-title text-[30px]">{prompt.title}</h1>
          {prompt.description && (
            <p className="mt-3 max-w-[650px] text-[15px] leading-6 text-secondary">
              {prompt.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openEdit(prompt)}>
            <Pencil size={14} />
            Edit
          </Button>
          {prompt.type === "skill" && prompt.package_path && (
            <a
              href={`/api/skills/${prompt.id}/download`}
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-[5px] border-[1.5px] border-ink bg-ink px-4 text-[12px] font-medium uppercase tracking-[0.06em] text-on-action transition-all hover:bg-accent hover:border-accent active:translate-x-px active:translate-y-px max-sm:min-h-11"
            >
              <Download size={14} />
              Download
            </a>
          )}
          <CopyButton content={prompt.content} />
        </div>
      </div>
      {prompt.type === "skill" && prompt.manifest && (
        <div className="mt-6 rounded-lg border border-border-subtle bg-surface-hover px-5 py-4 text-[13px]">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <Package size={13} />
            Skill manifest
          </div>
          <dl className="grid grid-cols-[76px_minmax(0,1fr)] gap-y-1.5 gap-x-2">
            <dt className="text-muted">Name</dt>
            <dd className="mono text-foreground">{prompt.manifest.name}</dd>
            <dt className="text-muted">Version</dt>
            <dd className="mono text-foreground">{prompt.manifest.version}</dd>
            {prompt.manifest.description && (
              <>
                <dt className="text-muted">Summary</dt>
                <dd className="text-secondary">{prompt.manifest.description}</dd>
              </>
            )}
          </dl>
        </div>
      )}
      <div className="mt-9 grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_224px]">
        <section className="min-w-0">
          <div className="flex items-center justify-between rounded-t-[13px] border border-b-0 border-border-subtle bg-surface-hover px-6 py-3.5 text-xs text-muted">
            <h2 className="font-semibold text-secondary">Prompt content</h2>
            <span className="text-[11px] tabular-nums">
              {prompt.content.length.toLocaleString()} characters
            </span>
          </div>
          <div className="rounded-b-[13px] border border-border-subtle bg-surface px-6 py-7 shadow-sm sm:px-8 sm:py-8">
            <pre className="prompt-content font-sans text-[15px] leading-7 text-foreground">
              {prompt.content}
            </pre>
          </div>
          {prompt.type === "template" && (
            <div className="mt-6 rounded-[13px] border border-border-subtle bg-surface-hover px-6 py-5 sm:px-8 sm:py-6">
              <h3 className="mb-3 text-sm font-semibold text-secondary">Fill in variables</h3>
              <TemplateFiller content={prompt.content} />
            </div>
          )}
        </section>
        <aside className="min-w-0">
          <h2 className="mb-5 text-sm font-semibold text-secondary">Details</h2>
          <PromptMetadataList prompt={prompt} />
          <div className="mt-7 space-y-1 border-t border-border pt-5">
            {prompt.status !== "inbox" && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => void changeStatus(prompt, "inbox")}
              >
                <Inbox size={14} />
                Move to Inbox
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={prompt.status === "library"}
              className="w-full justify-start"
              onClick={() => void changeStatus(prompt, "library")}
            >
              <BookOpen size={14} />
              Move to Library
            </Button>
            <Button
              variant="ghost"
              disabled={prompt.status === "tested"}
              className="w-full justify-start"
              onClick={() => void changeStatus(prompt, "tested")}
            >
              <CheckCircle2 size={14} />
              Mark as Tested
            </Button>
            <Button
              variant="ghost"
              disabled={prompt.status === "archived"}
              className="w-full justify-start"
              onClick={() => void changeStatus(prompt, "archived")}
            >
              <Archive size={14} />
              Archive
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start !text-danger"
              onClick={() => setDeleteTarget(prompt)}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PromptMetadataList({ prompt }: { prompt: Prompt }) {
  return (
    <dl className="space-y-4 text-xs">
      {[
        ["Type", TYPE_LABELS[prompt.type]],
        ["Category", prompt.category],
        ["Status", STATUS_LABELS[prompt.status]],
        ["Source", SOURCE_LABELS[prompt.source]],
      ].map(([label, value]) => (
        <div key={label} className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
          <dt className="text-muted">{label}</dt>
          <dd
            className={
              label === "Status" && prompt.status === "tested" ? "text-success" : "text-secondary"
            }
          >
            {value}
          </dd>
        </div>
      ))}
      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
        <dt className="text-muted">Tags</dt>
        <dd className="flex flex-wrap gap-1.5">
          {prompt.tags.length ? (
            prompt.tags.map((tag) => (
              <Link
                href={`/${prompt.status === "inbox" ? "inbox" : "library"}?${prompt.status === "archived" ? "status=archived&" : ""}tag=${encodeURIComponent(tag)}`}
                key={tag}
                className="tag-chip mono [overflow-wrap:anywhere] hover:text-accent"
              >
                {tag}
              </Link>
            ))
          ) : (
            <span className="text-muted">None</span>
          )}
        </dd>
      </div>
      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
        <dt className="text-muted">Source URL</dt>
        <dd>
          {prompt.source_url ? (
            <a
              href={prompt.source_url}
              rel="noopener noreferrer"
              target="_blank"
              className="inline-flex max-w-full items-start gap-1 text-accent hover:underline"
            >
              <span className="break-all">{prompt.source_url}</span>
              <ArrowUpRight size={12} className="mt-0.5 shrink-0" />
            </a>
          ) : (
            <span className="text-muted">Not added</span>
          )}
        </dd>
      </div>
      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
        <dt className="text-muted">Created</dt>
        <dd className="leading-5 text-secondary">
          <time dateTime={prompt.created_at}>{fullDate(prompt.created_at)}</time>
        </dd>
      </div>
      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
        <dt className="text-muted">Updated</dt>
        <dd className="leading-5 text-secondary">
          <time dateTime={prompt.updated_at}>{fullDate(prompt.updated_at)}</time>
        </dd>
      </div>
    </dl>
  );
}
