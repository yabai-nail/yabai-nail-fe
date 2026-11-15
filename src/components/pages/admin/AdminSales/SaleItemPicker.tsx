"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminNailDesignThumbnail } from "@/components/pages/admin/AdminNailDesigns/AdminNailDesignThumbnail";
import { formatMoney } from "@/lib/admin-format";
import { filterSaleTargets, type SaleTarget } from "./data";

/** Ticks every row the search shows; a dash while only some of them are ticked. */
function SelectAll({ checked, mixed, disabled, label, onChange }: Readonly<{ checked: boolean; mixed: boolean; disabled: boolean; label: string; onChange: () => void }>) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-admin-ink">
      <input ref={ref} type="checkbox" className="size-4 shrink-0 accent-admin-accent" checked={checked} disabled={disabled} onChange={onChange} />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

/**
 * "Chọn từng mẫu / dịch vụ": a searchable list with thumbnails and checkboxes. Picks hidden by
 * the search stay picked, so narrowing the list never drops what was chosen.
 */
export function SaleItemPicker({
  label,
  searchLabel,
  emptyText,
  items,
  selected,
  onChange,
}: Readonly<{
  label: string;
  searchLabel: string;
  emptyText: string;
  items: ReadonlyArray<SaleTarget>;
  selected: ReadonlyArray<string>;
  onChange: (ids: ReadonlyArray<string>) => void;
}>) {
  const t = useTranslations("admin.sales.picker");
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const picked = new Set(selected);
  const candidates = selectedOnly ? items.filter(item => picked.has(item.id)) : items;
  const shown = filterSaleTargets(candidates, query);
  const shownPicked = shown.filter((item) => picked.has(item.id)).length;
  const allShown = shown.length > 0 && shownPicked === shown.length;

  const showAll = () => {
    setQuery("");
    setSelectedOnly(false);
  };

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };
  const toggleShown = () => {
    const next = new Set(picked);
    for (const item of shown) {
      if (allShown) next.delete(item.id);
      else next.add(item.id);
    }
    onChange([...next]);
  };

  if (items.length === 0) return <p role="status" className="text-xs text-admin-muted">{emptyText}</p>;

  return (
    <fieldset className="grid min-w-0 gap-2 rounded-lg border border-admin-border p-3">
      <legend className="px-1 text-xs font-semibold text-admin-muted">{label}</legend>
      <AdminSearchField label={searchLabel} placeholder={searchLabel} value={query} onChange={setQuery} fullWidth />
      <label className="flex min-h-11 min-w-0 cursor-pointer items-center gap-2 text-sm text-admin-ink">
        <input type="checkbox" className="size-4 shrink-0 accent-admin-accent" checked={selectedOnly} onChange={event => setSelectedOnly(event.target.checked)} />
        <span className="min-w-0 break-words">{t("selectedOnly", { count: picked.size })}</span>
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SelectAll
          checked={allShown}
          mixed={shownPicked > 0 && !allShown}
          disabled={shown.length === 0}
          label={t("selectAll", { count: shown.length })}
          onChange={toggleShown}
        />
        <span aria-live="polite" className="text-xs font-semibold text-admin-accent">{t("selected", { count: picked.size })}</span>
      </div>
      {shown.length === 0 ? (
        <div className="grid justify-items-center gap-2 py-4">
          <p role="status" className="text-center text-xs text-admin-muted">{t(selectedOnly && picked.size === 0 ? "noneSelected" : "noMatch")}</p>
          <button type="button" className="min-h-11 rounded-lg px-3 text-sm font-semibold text-admin-accent focus-visible:ring-2 focus-visible:ring-admin-accent" onClick={showAll}>{t("showAll")}</button>
        </div>
      ) : (
        <ul className="max-h-72 divide-y divide-admin-border overflow-y-auto rounded-lg border border-admin-border">
          {shown.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-admin-soft focus-within:bg-admin-soft">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-admin-accent"
                  checked={picked.has(item.id)}
                  aria-label={item.name}
                  onChange={() => toggle(item.id)}
                />
                <AdminNailDesignThumbnail imageUrl={item.imageUrl} alt="" />
                <span className="min-w-0 flex-1 break-words text-sm text-admin-ink">{item.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-admin-muted">
                  {item.price === null ? t("noPrice") : formatMoney(item.price)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
