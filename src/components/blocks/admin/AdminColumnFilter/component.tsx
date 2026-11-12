"use client";

import { FunnelIcon } from "@heroicons/react/20/solid";
import { Button, Popover } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export type ColumnFilterOption<V extends string = string> = { readonly value: V; readonly label: string; readonly count?: number };

/**
 * A table header's filter, in the shape admins know from spreadsheet and Ant Design tables: a
 * funnel that turns accent when the column is filtered, a checklist, and Reset / Filter. Ticks
 * are a draft until Filter is pressed, so the table does not jump on every click. Generic on
 * the option value, so a column with a closed set of values gets them back typed.
 */
export function AdminColumnFilter<V extends string = string>({
  label,
  options,
  selected,
  onApply,
  searchable = false,
}: Readonly<{
  /** Names the funnel for screen readers, e.g. "Filter by category". */
  label: string;
  options: ReadonlyArray<ColumnFilterOption<V>>;
  selected: ReadonlyArray<V>;
  onApply: (values: ReadonlyArray<V>) => void;
  searchable?: boolean;
}>) {
  const t = useTranslations("admin.common.columnFilter");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ReadonlyArray<V>>(selected);
  const [term, setTerm] = useState("");
  const active = selected.length > 0;
  const needle = term.trim().toLocaleLowerCase("vi");
  const shown = needle ? options.filter((option) => option.label.toLocaleLowerCase("vi").includes(needle)) : options;

  // Reopening starts from what is applied, not from ticks that were never confirmed.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(selected);
      setTerm("");
    }
    setOpen(next);
  };
  const toggle = (value: V) =>
    setDraft((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  const apply = (values: ReadonlyArray<V>) => {
    onApply(values);
    setOpen(false);
  };

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={label}
        className={`size-7 min-h-7 min-w-7 rounded-md ${active ? "bg-admin-soft text-admin-accent" : "text-admin-muted hover:text-admin-ink"}`}
        onPress={() => handleOpenChange(!open)}
      >
        <FunnelIcon className="size-3.5" />
      </Button>
      {/* `admin-shell` keeps the --admin-* tokens on a popover that portals out of the admin subtree. */}
      <Popover.Content placement="bottom end" className="admin-shell z-50">
        <Popover.Dialog
          aria-label={label}
          className="w-64 overflow-hidden rounded-lg border border-admin-border bg-admin-surface p-0 text-admin-ink shadow-atelier outline-none"
        >
          {searchable ? (
            <div className="border-b border-admin-border p-2">
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t("search")}
                aria-label={t("search")}
                className="min-h-9 w-full rounded-md border border-admin-border bg-admin-surface px-2.5 text-sm text-admin-ink outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
              />
            </div>
          ) : null}
          <ul className="max-h-64 overflow-y-auto py-1">
            {shown.map((option) => (
              <li key={option.value}>
                <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-admin-soft">
                  <input
                    type="checkbox"
                    className="size-4 accent-admin-accent"
                    checked={draft.includes(option.value)}
                    onChange={() => toggle(option.value)}
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.count !== undefined ? (
                    <span className="text-xs tabular-nums text-admin-muted">{option.count}</span>
                  ) : null}
                </label>
              </li>
            ))}
            {shown.length === 0 ? <li className="px-3 py-2 text-xs text-admin-muted">{t("noMatch")}</li> : null}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-admin-border px-2 py-2">
            <Button size="sm" variant="ghost" className="rounded-md" isDisabled={draft.length === 0 && !active} onPress={() => apply([])}>
              {t("reset")}
            </Button>
            <Button size="sm" variant="primary" className="rounded-md" onPress={() => apply(draft)}>
              {t("apply")}
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export const meta = { world: "pure", domain: "admin-column-filter" } as const;
