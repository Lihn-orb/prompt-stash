"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Inbox,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useWorkspace } from "@/components/workspace-provider";
import { Button, Hint } from "@/components/ui/button";
import type { Prompt } from "@/types/prompt";

export function PromptMenu({ prompt }: { prompt: Prompt }) {
  const { openEdit, setDeleteTarget, changeStatus } = useWorkspace();
  return (
    <DropdownMenu.Root>
      <Hint label="More actions">
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon" aria-label={`More actions for ${prompt.title}`}>
            <MoreHorizontal size={17} />
          </Button>
        </DropdownMenu.Trigger>
      </Hint>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu-content" align="end" sideOffset={5}>
          <DropdownMenu.Item className="menu-item" onSelect={() => openEdit(prompt)}>
            <Pencil size={14} />
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="mx-1 my-1 h-px bg-border" />
          {prompt.status !== "inbox" && (
            <DropdownMenu.Item
              className="menu-item"
              onSelect={() => void changeStatus(prompt, "inbox")}
            >
              <Inbox size={14} />
              Move to Inbox
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            className="menu-item"
            disabled={prompt.status === "library"}
            onSelect={() => void changeStatus(prompt, "library")}
          >
            <BookOpen size={14} />
            Move to Library
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="menu-item"
            disabled={prompt.status === "tested"}
            onSelect={() => void changeStatus(prompt, "tested")}
          >
            <CheckCircle2 size={14} />
            Mark as Tested
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="menu-item"
            disabled={prompt.status === "archived"}
            onSelect={() => void changeStatus(prompt, "archived")}
          >
            <Archive size={14} />
            Archive
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="mx-1 my-1 h-px bg-border" />
          <DropdownMenu.Item
            className="menu-item text-danger"
            onSelect={() => setDeleteTarget(prompt)}
          >
            <Trash2 size={14} />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
