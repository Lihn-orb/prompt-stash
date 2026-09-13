"use client";

import { ChevronDown } from "lucide-react";
import {
  SOURCE_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  MAX_TAGS,
  MAX_TAG_LENGTH,
} from "@/lib/constants";
import {
  CATEGORIES,
  PROMPT_SOURCES,
  PROMPT_STATUSES,
  PROMPT_TYPES,
  type PromptMetadata,
  type PromptSource,
  type PromptStatus,
} from "@/types/prompt";

export function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          className="input appearance-none pr-8"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-3.5 text-muted"
        />
      </div>
    </div>
  );
}

export interface EditFields extends PromptMetadata {
  status: PromptStatus;
  source: PromptSource;
}

export function PromptEditFields({
  fields,
  onChange,
  tags,
  onTagsChange,
}: {
  fields: EditFields;
  onChange: (fields: EditFields) => void;
  tags: string;
  onTagsChange: (value: string) => void;
}) {
  return (
    <>
      <div>
        <label className="field-label" htmlFor="prompt-description">
          Description
        </label>
        <textarea
          id="prompt-description"
          className="input min-h-20 resize-y"
          maxLength={1000}
          value={fields.description}
          onChange={(event) => onChange({ ...fields, description: event.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          name="prompt-category"
          label="Category"
          value={fields.category}
          options={CATEGORIES.map((value) => ({ value, label: value }))}
          onChange={(category) =>
            onChange({ ...fields, category: category as EditFields["category"] })
          }
        />
        <SelectField
          name="prompt-type"
          label="Type"
          value={fields.type}
          options={PROMPT_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }))}
          onChange={(type) => onChange({ ...fields, type: type as EditFields["type"] })}
        />
        <SelectField
          name="prompt-status"
          label="Status"
          value={fields.status}
          options={PROMPT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
          onChange={(status) => onChange({ ...fields, status: status as PromptStatus })}
        />
        <SelectField
          name="prompt-source"
          label="Source"
          value={fields.source}
          options={PROMPT_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value] }))}
          onChange={(source) => onChange({ ...fields, source: source as PromptSource })}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="prompt-tags">
          Tags
        </label>
        <input
          id="prompt-tags"
          className="input"
          placeholder="design, research, writing"
          maxLength={MAX_TAGS * (MAX_TAG_LENGTH + 2)}
          value={tags}
          onChange={(event) => onTagsChange(event.target.value)}
        />
      </div>
    </>
  );
}
