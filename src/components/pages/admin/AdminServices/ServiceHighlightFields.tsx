"use client";

import { useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { HeartIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { MAX_HIGHLIGHTS, MAX_HIGHLIGHT_LENGTH, normalizeHighlights } from "./service-highlights";

export function ServiceHighlightFields({ value, onChange, disabled }: Readonly<{
  value: readonly string[];
  onChange: (lines: string[]) => void;
  disabled: boolean;
}>) {
  const t = useTranslations("admin.services.highlights");
  const id = useId();
  const inputs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const addButton = useRef<HTMLButtonElement>(null);
  const preview = normalizeHighlights(value);
  const focusRow = (index: number) => requestAnimationFrame(() => {
    (inputs.current[index] ?? addButton.current)?.focus();
  });

  return (
    <fieldset disabled={disabled} className="min-w-0 rounded-xl border border-admin-border bg-admin-soft p-4">
      <legend className="px-1 text-sm font-semibold text-admin-ink">{t("title")}</legend>
      <p id={`${id}-hint`} className="mb-4 text-xs leading-5 text-admin-muted">{t("hint")}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          {value.map((line, index) => (
            <div key={index} className="flex items-start gap-2">
              <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-admin-surface text-xs font-semibold text-admin-muted">{index + 1}</span>
              <label className="min-w-0 flex-1">
                <span className="sr-only">{t("line", { number: index + 1 })}</span>
                <textarea
                  ref={(element) => { inputs.current[index] = element; }}
                  value={line}
                  rows={2}
                  maxLength={MAX_HIGHLIGHT_LENGTH}
                  aria-describedby={`${id}-hint`}
                  placeholder={t("placeholder")}
                  className="w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm leading-5 text-admin-ink placeholder:text-admin-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
                  onChange={(event) => onChange(value.map((current, row) => row === index ? event.target.value : current))}
                />
                <span className="block text-right text-xs tabular-nums text-admin-muted">{line.length}/{MAX_HIGHLIGHT_LENGTH}</span>
              </label>
              <button
                type="button"
                aria-label={t("remove", { number: index + 1 })}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-surface hover:text-admin-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent disabled:opacity-50"
                onClick={() => { onChange(value.filter((_, row) => row !== index)); focusRow(Math.max(0, index - 1)); }}
              ><TrashIcon aria-hidden className="size-4" /></button>
            </div>
          ))}
          <button
            ref={addButton}
            type="button"
            disabled={disabled || value.length >= MAX_HIGHLIGHTS}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-accent hover:border-admin-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => { onChange([...value, ""]); focusRow(value.length); }}
          ><PlusIcon aria-hidden className="size-4" />{t("add")} <span className="font-normal text-admin-muted">({value.length}/{MAX_HIGHLIGHTS})</span></button>
        </div>
        <div className="min-w-0 self-start rounded-lg border border-admin-border bg-admin-surface p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-admin-muted">{t("preview")}</h4>
          {preview.length ? (
            <ul className="space-y-2">
              {preview.map((line, index) => <li key={index} className="flex items-start gap-2 text-sm leading-6 text-admin-ink"><HeartIcon aria-hidden className="mt-1 size-4 shrink-0 text-admin-accent" /><span className="min-w-0 whitespace-pre-wrap break-words">{line}</span></li>)}
            </ul>
          ) : <p className="text-sm leading-6 text-admin-muted">{t("empty")}</p>}
        </div>
      </div>
    </fieldset>
  );
}
