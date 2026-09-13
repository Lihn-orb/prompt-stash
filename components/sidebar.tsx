"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Archive,
  BookOpen,
  Braces,
  Inbox,
  SquareTerminal,
  Terminal,
  Workflow,
  X,
} from "lucide-react";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui/button";
import { TYPE_LABELS } from "@/lib/constants";
import { PROMPT_TYPES } from "@/types/prompt";

const typeIcons = { prompt: Terminal, template: Braces, skill: Workflow };

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { prompts, setQuery, setMobileOpen } = useWorkspace();
  const activeType = params.get("type");
  const activeTag = params.get("tag");
  const isArchived = params.get("status") === "archived";
  const counts = {
    inbox: prompts.filter((prompt) => prompt.status === "inbox").length,
    library: prompts.filter((prompt) => ["library", "tested"].includes(prompt.status)).length,
  };
  const onNavigate = () => {
    setQuery("");
    setMobileOpen(false);
  };
  const navClass = (active: boolean) =>
    `flex min-h-9 items-center gap-3 rounded-[5px] px-3 text-[13px] transition-colors active:translate-x-px max-sm:min-h-11 ${
      active
        ? "bg-ink font-semibold text-on-action"
        : "text-secondary hover:bg-surface-raised hover:text-foreground"
    }`;

  return (
    <div className="flex h-full w-full flex-col border-r-0 bg-sidebar">
      <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b-[1.5px] border-ink px-5">
        <Link href="/inbox" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-ink bg-ink text-on-action">
            <SquareTerminal size={16} strokeWidth={2.2} />
          </span>
          <span className="text-[14px] font-bold uppercase tracking-[0.02em]">Prompt Inbox</span>
        </Link>
        {mobile && (
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={17} />
          </Button>
        )}
      </div>

      <nav aria-label="Main navigation" className="min-h-0 flex-1 overflow-y-auto px-4">
        <p className="label-caps mb-2 px-3 pt-3 text-muted">My Collection</p>
        <div className="space-y-1">
          <Link
            href="/inbox"
            onClick={onNavigate}
            className={navClass(pathname === "/inbox")}
            aria-current={pathname === "/inbox" ? "page" : undefined}
          >
            <Inbox size={18} strokeWidth={1.9} />
            <span>Inbox</span>
            <span
              className={`ml-auto text-xs tabular-nums ${pathname === "/inbox" ? "text-on-action" : "text-muted"}`}
            >
              {counts.inbox}
            </span>
          </Link>
          <Link
            href="/library"
            onClick={onNavigate}
            className={navClass(
              pathname === "/library" && !activeType && !activeTag && !isArchived,
            )}
            aria-current={
              pathname === "/library" && !activeType && !activeTag && !isArchived
                ? "page"
                : undefined
            }
          >
            <BookOpen size={18} strokeWidth={1.9} />
            <span>Library</span>
            <span
              className={`ml-auto text-xs tabular-nums ${pathname === "/library" && !activeType && !activeTag && !isArchived ? "text-on-action" : "text-muted"}`}
            >
              {counts.library}
            </span>
          </Link>
        </div>

        <div className="mx-3 my-6 border-t border-border-subtle" />
        <p className="label-caps mb-2 px-3 text-muted">Types</p>
        <div className="space-y-1">
          {PROMPT_TYPES.map((type) => {
            const Icon = typeIcons[type];
            return (
              <Link
                key={type}
                href={`/library?type=${type}`}
                onClick={onNavigate}
                className={navClass(activeType === type)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{TYPE_LABELS[type]}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-border-subtle p-4">
        <Link href="/library?status=archived" onClick={onNavigate} className={navClass(isArchived)}>
          <Archive size={16} strokeWidth={1.6} />
          <span>Archived</span>
        </Link>
      </div>
    </div>
  );
}
