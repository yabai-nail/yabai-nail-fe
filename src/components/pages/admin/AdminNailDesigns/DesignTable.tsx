"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { Button, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { AdminColumnFilter, type ColumnFilterOption } from "@/components/blocks/admin/AdminColumnFilter";
import { AdminSalePrice } from "@/components/blocks/admin/AdminSalePrice";
import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { AdminNailDesignThumbnail } from "./AdminNailDesignThumbnail";
import type { DesignRow } from "./data";

export type SaleFilter = ReadonlyArray<"onSale">;

/** Ticks every row on the page; shows a dash while only some of them are ticked. */
export function PageCheckbox({ checked, mixed, disabled, label, onChange }: Readonly<{ checked: boolean; mixed: boolean; disabled: boolean; label: string; onChange: () => void }>) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return <input ref={ref} type="checkbox" className="size-4 accent-admin-accent" checked={checked} disabled={disabled} aria-label={label} onChange={onChange} />;
}

export function DesignTable({
  rows,
  tierNames,
  tierOptions,
  tierFilter,
  onTierFilterChange,
  saleFilter,
  onSaleFilterChange,
  selected,
  onSelectedChange,
  emptyText,
  onEdit,
  onDelete,
}: Readonly<{
  /** The rows on the current page. */
  rows: ReadonlyArray<DesignRow>;
  tierNames: ReadonlyMap<string, string>;
  /** The tiers plus the typed-price option, each with its row count. */
  tierOptions: ReadonlyArray<ColumnFilterOption>;
  tierFilter: ReadonlyArray<string>;
  onTierFilterChange: (next: ReadonlyArray<string>) => void;
  saleFilter: SaleFilter;
  onSaleFilterChange: (next: SaleFilter) => void;
  /** Ticked design ids, kept across pages and filters. */
  selected: ReadonlySet<string>;
  onSelectedChange: (next: ReadonlySet<string>) => void;
  emptyText: string;
  onEdit?: (row: DesignRow) => void;
  onDelete?: (row: DesignRow) => void;
}>) {
  const t = useTranslations("admin.nailDesigns");
  const tickedOnPage = rows.filter((row) => selected.has(row.id)).length;
  const allOnPage = rows.length > 0 && tickedOnPage === rows.length;
  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (!next.delete(id)) next.add(id);
    onSelectedChange(next);
  };
  const togglePage = () => {
    const next = new Set(selected);
    for (const row of rows) {
      if (allOnPage) next.delete(row.id);
      else next.add(row.id);
    }
    onSelectedChange(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">{t("table.caption")}</caption>
        <thead className="border-b border-admin-border bg-admin-soft/60 text-xs font-semibold text-admin-ink">
          <tr>
            <th scope="col" className="w-10 py-2 pl-4">
              <PageCheckbox checked={allOnPage} mixed={tickedOnPage > 0 && !allOnPage} disabled={rows.length === 0} label={t("table.selectPage")} onChange={togglePage} />
            </th>
            <AdminSortableHeader className="px-3">{t("columns.design")}</AdminSortableHeader>
            <AdminSortableHeader
              filter={
                <AdminColumnFilter
                  label={t("table.filterTier")}
                  options={tierOptions}
                  selected={tierFilter}
                  onApply={onTierFilterChange}
                  searchable={tierOptions.length > 6}
                />
              }
            >
              {t("columns.tier")}
            </AdminSortableHeader>
            <AdminSortableHeader
              filter={
                <AdminColumnFilter
                  label={t("table.filterPrice")}
                  options={[{ value: "onSale" as const, label: t("table.onSale") }]}
                  selected={saleFilter}
                  onApply={onSaleFilterChange}
                />
              }
            >
              {t("columns.price")}
            </AdminSortableHeader>
            <AdminSortableHeader>{t("statusLabel")}</AdminSortableHeader>
            <AdminSortableHeader>{t("columns.actions")}</AdminSortableHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {rows.map((row) => (
            <tr key={row.id} className={selected.has(row.id) ? "bg-admin-soft/40" : undefined}>
              <td className="py-2 pl-4">
                <input
                  type="checkbox"
                  className="size-4 accent-admin-accent"
                  checked={selected.has(row.id)}
                  aria-label={t("table.selectDesign", { name: row.title })}
                  onChange={() => toggleRow(row.id)}
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <AdminNailDesignThumbnail imageUrl={row.thumbnailUrl} mediaId={row.mediaIds[0]} alt={row.title} />
                  <span className="font-medium text-admin-ink">{row.title}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {row.priceTierId ? (
                  <Chip size="sm" variant="soft" color="accent">
                    <Chip.Label>{tierNames.get(row.priceTierId) ?? "—"}</Chip.Label>
                  </Chip>
                ) : (
                  <span className="text-xs text-admin-muted">{t("table.customPrice")}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-semibold text-admin-ink">
                {row.indicativePrice === null && !row.sale ? t("priceMissing") : <AdminSalePrice original={row.indicativePrice} sale={row.sale} />}
              </td>
              <td className="px-3 py-2">
                <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                  {t.has(`status.${row.status}`) ? t(`status.${row.status}`) : row.status}
                </span>
              </td>
              <td className="px-3 py-2">
                {onEdit || onDelete ? (
                  <div className="flex gap-1">
                    {onEdit ? <Button size="sm" variant="outline" className="rounded-lg" onPress={() => onEdit(row)}>{t("edit")}</Button> : null}
                    {onDelete ? (
                      <Button isIconOnly size="sm" variant="ghost" className="rounded-lg text-admin-danger" aria-label={t("deleteDesign", { name: row.title })} onPress={() => onDelete(row)}>
                        <TrashIcon className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p role="status" className="p-12 text-center text-sm text-admin-muted">{emptyText}</p> : null}
    </div>
  );
}
