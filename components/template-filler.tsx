"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { CopyButton } from "@/components/prompt-card";

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export function extractVariables(content: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const match of content.matchAll(PLACEHOLDER)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      ordered.push(name);
    }
  }
  return ordered;
}

export function applyVariables(content: string, values: Record<string, string>): string {
  return content.replace(PLACEHOLDER, (raw, name: string) => {
    const value = values[name];
    return value && value.length > 0 ? value : raw;
  });
}

export function TemplateFiller({ content }: { content: string }) {
  const variables = useMemo(() => extractVariables(content), [content]);
  const [values, setValues] = useState<Record<string, string>>({});

  if (variables.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-subtle bg-surface-hover px-4 py-3 text-xs text-muted">
        No <span className="mono">{`{{variables}}`}</span> detected in the content. Add double-curly
        placeholders like <span className="mono">{`{{name}}`}</span> to enable the filler.
      </p>
    );
  }

  const rendered = applyVariables(content, values);
  const complete = variables.every((name) => values[name]?.trim());

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {variables.map((name) => (
          <label key={name} className="block text-xs">
            <span className="field-label mono normal-case tracking-normal">{name}</span>
            <input
              value={values[name] ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
              placeholder={`Value for ${name}`}
              className="input mt-1 text-[13px]"
            />
          </label>
        ))}
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 text-[11px] uppercase tracking-wider text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} />
            Preview
            {!complete && <span className="text-muted">(placeholders remaining)</span>}
          </span>
          <CopyButton content={rendered} compact />
        </div>
        <pre className="prompt-content whitespace-pre-wrap px-4 py-3 font-sans text-[13px] leading-6 text-foreground">
          {rendered}
        </pre>
      </div>
    </div>
  );
}
