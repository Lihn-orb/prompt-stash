"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, FileArchive, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PromptEditFields, type EditFields } from "@/components/prompt-fields";
import { useWorkspace } from "@/components/workspace-provider";
import { MAX_CONTENT_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import { errorMessage } from "@/lib/utils";
import type { Prompt } from "@/types/prompt";

type AddMode = "prompt" | "template" | "skill";

export function PromptDialog({ prompt }: { prompt?: Prompt }) {
  const { closeEditor, createPrompt, updatePrompt, uploadSkill, setQuery, searchRef } =
    useWorkspace();
  const router = useRouter();
  const [content, setContent] = useState(prompt?.content ?? "");
  const [title, setTitle] = useState(prompt?.title ?? "");
  const [sourceUrl, setSourceUrl] = useState(prompt?.source_url ?? "");
  const [aiOrganize, setAiOrganize] = useState(true);
  const [tags, setTags] = useState(prompt?.tags.join(", ") ?? "");
  const [addMode, setAddMode] = useState<AddMode>("prompt");
  const [skillFile, setSkillFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fields, setFields] = useState<EditFields>({
    title: prompt?.title ?? "",
    description: prompt?.description ?? "",
    category: prompt?.category ?? "Other",
    type: prompt?.type ?? "prompt",
    tags: prompt?.tags ?? [],
    status: prompt?.status ?? "inbox",
    source: prompt?.source ?? "manual",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const originalFocus = useRef(typeof document === "undefined" ? null : document.activeElement);

  const save = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (prompt) {
        if (!content.trim()) throw new Error("Prompt content is required.");
        await updatePrompt(prompt.id, {
          ...fields,
          content,
          title: title.trim(),
          source_url: sourceUrl.trim() || null,
          tags: [
            ...new Set(
              tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            ),
          ],
        });
        toast.success("Prompt updated");
      } else if (addMode === "skill") {
        if (!skillFile) throw new Error("Drop a .zip package to upload a skill.");
        await uploadSkill(skillFile);
        setQuery("");
        router.push("/library?type=skill");
        toast.success("Skill uploaded");
      } else {
        if (!content.trim()) throw new Error("Prompt content is required.");
        await createPrompt({
          content,
          title,
          sourceUrl,
          aiOrganize,
          source: "manual",
          type: addMode,
        });
        setQuery("");
        router.push("/inbox");
        toast.success("Prompt saved");
      }
      closeEditor();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    !saving &&
    (prompt
      ? !!content.trim() && !!title.trim()
      : addMode === "skill"
        ? !!skillFile
        : !!content.trim());

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !saving) closeEditor();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-panel"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            contentRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (
              originalFocus.current instanceof HTMLElement &&
              originalFocus.current.isConnected &&
              originalFocus.current !== document.body
            )
              originalFocus.current.focus();
            else searchRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (saving) event.preventDefault();
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="flex items-center justify-between px-7 pb-1 pt-6">
            <Dialog.Title className="text-xl font-semibold">
              {prompt ? "Edit Prompt" : addMode === "skill" ? "Add Skill" : "Add Prompt"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="icon" variant="ghost" aria-label="Close modal" disabled={saving}>
                <X size={18} />
              </Button>
            </Dialog.Close>
          </div>
          <form onSubmit={save}>
            <fieldset disabled={saving} className="space-y-5 px-7 py-5">
              {!prompt && (
                <div role="group" aria-label="Type" className="flex gap-1 rounded-lg border border-border-subtle p-1 text-[13px]">
                  {(["prompt", "template", "skill"] as AddMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAddMode(m)}
                      className={`flex-1 rounded-md px-3 py-1.5 font-medium capitalize transition-colors ${
                        addMode === m
                          ? "bg-foreground text-background"
                          : "text-secondary hover:text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
              {!prompt && addMode === "skill" ? (
                <div>
                  <label className="field-label" htmlFor="skill-package">
                    Skill package <span className="text-accent">*</span>
                  </label>
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      const file = event.dataTransfer.files?.[0];
                      if (file) setSkillFile(file);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                      dragActive
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-border-strong"
                    }`}
                  >
                    <FileArchive size={22} className="text-muted" />
                    {skillFile ? (
                      <div className="text-sm">
                        <p className="font-medium text-foreground">{skillFile.name}</p>
                        <p className="text-[11px] text-muted">
                          {(skillFile.size / 1024).toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                          })}{" "}
                          KB — click or drop to replace
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-secondary">
                        <p>
                          Drop a <span className="mono">.zip</span> here, or click to browse
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          Must contain a <span className="mono">SKILL.md</span> with{" "}
                          <span className="mono">name</span>, <span className="mono">version</span>,{" "}
                          <span className="mono">description</span> frontmatter
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    id="skill-package"
                    type="file"
                    accept=".zip,application/zip"
                    className="sr-only"
                    onChange={(event) => setSkillFile(event.target.files?.[0] ?? null)}
                  />
                </div>
              ) : (
                <div>
                  <label className="field-label" htmlFor="prompt-content">
                    Prompt <span className="text-accent">*</span>
                  </label>
                  <textarea
                    ref={contentRef}
                    id="prompt-content"
                    required
                    maxLength={MAX_CONTENT_LENGTH}
                    placeholder="Paste your prompt here..."
                    className="input min-h-[210px] resize-y text-[14px] leading-6"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                  />
                  <p className="mt-1 text-right text-[11px] tabular-nums text-muted">
                    {content.length.toLocaleString()} characters
                  </p>
                </div>
              )}
              {(!!prompt || addMode !== "skill") && (
                <div>
                  <label className="field-label" htmlFor="prompt-title">
                    Title {!prompt && <span className="ml-1 font-normal text-muted">(optional)</span>}
                  </label>
                  <input
                    id="prompt-title"
                    required={!!prompt}
                    maxLength={MAX_TITLE_LENGTH}
                    className="input"
                    placeholder="Give it a name"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
              )}
              {prompt && (
                <PromptEditFields
                  fields={fields}
                  onChange={setFields}
                  tags={tags}
                  onTagsChange={setTags}
                />
              )}
              {(!!prompt || addMode !== "skill") && (
                <div>
                  <label className="field-label" htmlFor="prompt-source-url">
                    Source URL <span className="ml-1 font-normal text-muted">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="prompt-source-url"
                      type="url"
                      maxLength={2048}
                      className="input pr-10"
                      placeholder="https://"
                      value={sourceUrl}
                      onChange={(event) => setSourceUrl(event.target.value)}
                    />
                    <ArrowUpRight
                      size={15}
                      className="pointer-events-none absolute right-3 top-3.5 text-muted"
                    />
                  </div>
                </div>
              )}
              {!prompt && addMode !== "skill" && (
                <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-border-subtle pt-5 text-[13px] text-secondary">
                  AI organize automatically
                  <input
                    type="checkbox"
                    role="switch"
                    className="toggle-control"
                    checked={aiOrganize}
                    onChange={(event) => setAiOrganize(event.target.checked)}
                  />
                </label>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger"
                >
                  {error}
                </p>
              )}
            </fieldset>
            <footer className="flex justify-end gap-2.5 border-t border-border-subtle px-7 py-4">
              <Button onClick={closeEditor} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!canSubmit}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving
                  ? addMode === "skill" && !prompt
                    ? "Uploading..."
                    : "Saving..."
                  : prompt
                    ? "Save changes"
                    : addMode === "skill"
                      ? "Upload skill"
                      : "Save prompt"}
              </Button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
