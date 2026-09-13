"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace-provider";
import { errorMessage } from "@/lib/utils";

export function DeleteDialog() {
  const { deleteTarget, setDeleteTarget, removePrompt, searchRef } = useWorkspace();
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const confirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await removePrompt(deleteTarget.id);
      if (pathname === `/prompts/${deleteTarget.id}`) router.push("/inbox");
      setDeleteTarget(null);
      toast.success("Prompt deleted");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  };
  return (
    <Dialog.Root
      open={!!deleteTarget}
      onOpenChange={(open) => {
        if (!open && !deleting) setDeleteTarget(null);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-panel !max-w-[420px] p-6"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (deleting) event.preventDefault();
          }}
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-danger/20 bg-danger/5 text-danger">
            <Trash2 size={18} />
          </div>
          <Dialog.Title className="text-lg font-semibold">Delete prompt?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-secondary">
            &quot;{deleteTarget?.title}&quot; will be permanently deleted. This cannot be undone.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Button ref={cancelRef} onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirm} disabled={deleting}>
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete prompt
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
