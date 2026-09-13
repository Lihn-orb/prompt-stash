"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Menu, Plus } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { useWorkspace } from "@/components/workspace-provider";
import { PromptDialog } from "@/components/prompt-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { WorkspaceToast } from "@/components/toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { searchRef, openAdd, editor, deleteTarget, mobileOpen, setMobileOpen } = useWorkspace();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        if (!editor && !deleteTarget) {
          setMobileOpen(false);
          searchRef.current?.focus();
          searchRef.current?.select();
        }
      } else if (key === "n") {
        event.preventDefault();
        if (!editor && !deleteTarget) {
          setMobileOpen(false);
          openAdd();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openAdd, editor, deleteTarget, searchRef, setMobileOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [setMobileOpen]);

  return (
    <Tooltip.Provider delayDuration={350}>
      <a
        href="#main-content"
        className="sr-only z-100 rounded-md bg-accent p-3 text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="min-h-dvh">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] border-r-[1.5px] border-ink md:block">
          <Sidebar />
        </aside>
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay md:hidden" />
            <Dialog.Content
              className="fixed inset-y-0 left-0 z-60 w-[272px] max-w-[85vw] border-r border-border bg-sidebar md:hidden"
              aria-describedby={undefined}
            >
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <Sidebar mobile />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="min-w-0 md:pl-[224px]">
          <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between gap-3 border-b-[1.5px] border-ink bg-toolbar px-4 backdrop-blur-md sm:px-8 lg:px-14">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={19} />
            </Button>
            <SearchBar />
            <Button
              variant="primary"
              aria-label="Add prompt"
              onClick={openAdd}
              className="max-sm:!w-11 max-sm:!px-0"
            >
              <Plus size={16} strokeWidth={2.2} />
              <span className="hidden sm:inline">Add Prompt</span>
            </Button>
          </header>
          <main
            id="main-content"
            className="px-5 pb-16 pt-8 sm:px-8 lg:px-14"
          >
            {children}
          </main>
        </div>
      </div>
      {editor && (
        <PromptDialog
          key={editor === "new" ? "new" : editor.id}
          prompt={editor === "new" ? undefined : editor}
        />
      )}
      <DeleteDialog />
      <WorkspaceToast />
    </Tooltip.Provider>
  );
}
