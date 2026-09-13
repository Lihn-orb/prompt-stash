"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { toast } from "sonner";
import { STATUS_LABELS } from "@/lib/constants";
import { errorMessage } from "@/lib/utils";
import { selectStore } from "@/services/prompt-store";
import type { BackendMode } from "@/lib/runtime";
import type { CreatePromptInput, Prompt, PromptStatus, UpdatePromptInput } from "@/types/prompt";

interface WorkspaceContextValue {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  editor: "new" | Prompt | null;
  openAdd: () => void;
  openEdit: (prompt: Prompt) => void;
  closeEditor: () => void;
  deleteTarget: Prompt | null;
  setDeleteTarget: (prompt: Prompt | null) => void;
  refresh: () => void;
  createPrompt: (input: CreatePromptInput) => Promise<Prompt>;
  updatePrompt: (id: string, input: UpdatePromptInput) => Promise<Prompt>;
  removePrompt: (id: string) => Promise<void>;
  uploadSkill: (file: File) => Promise<Prompt>;
  changeStatus: (prompt: Prompt, status: PromptStatus) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  mode,
  children,
}: {
  mode: BackendMode;
  children: React.ReactNode;
}) {
  const store = useMemo(() => selectStore(mode), [mode]);
  const { prompts, error, loading } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editor, setEditor] = useState<"new" | Prompt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Prompt | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const openAdd = useCallback(() => setEditor("new"), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const createPrompt = useCallback(
    (input: CreatePromptInput) => Promise.resolve(store.create(input)),
    [store],
  );
  const updatePrompt = useCallback(
    (id: string, input: UpdatePromptInput) => Promise.resolve(store.update(id, input)),
    [store],
  );
  const removePrompt = useCallback((id: string) => Promise.resolve(store.remove(id)), [store]);

  const uploadSkill = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.append("package", file);
      const response = await fetch("/api/skills", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as
        | { success: true; prompt: Prompt }
        | { success: false; error: string }
        | null;
      if (!response.ok || !payload || payload.success !== true) {
        throw new Error(
          (payload && "error" in payload && payload.error) ||
            `Upload failed with status ${response.status}.`,
        );
      }
      store.reload();
      return payload.prompt;
    },
    [store],
  );

  const changeStatus = useCallback(
    async (prompt: Prompt, status: PromptStatus) => {
      try {
        await store.update(prompt.id, { status });
        toast.success(
          status === "tested" ? "Marked as tested" : `Moved to ${STATUS_LABELS[status]}`,
        );
      } catch (cause) {
        toast.error(errorMessage(cause));
      }
    },
    [store],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        prompts,
        loading,
        error,
        query,
        setQuery,
        searchRef,
        mobileOpen,
        setMobileOpen,
        editor,
        openAdd,
        openEdit: setEditor,
        closeEditor,
        deleteTarget,
        setDeleteTarget,
        refresh: store.reload,
        createPrompt,
        updatePrompt,
        removePrompt,
        uploadSkill,
        changeStatus,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("WorkspaceProvider is required.");
  return context;
}
