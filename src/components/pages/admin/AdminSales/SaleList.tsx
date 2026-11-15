"use client";

import { DocumentDuplicateIcon, PencilSquareIcon, StopCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { formatMoney } from "@/lib/admin-format";
import type { AdminSale } from "@/service";
import { describeSaleRule, filterSales, saleLoweredCounts, type SaleListStatus, type SaleTarget } from "./data";

const statusColor = { ACTIVE: "success", UPCOMING: "warning", ENDED: "default" } as const;
const statuses = ["ALL", "ACTIVE", "UPCOMING", "ENDED"] as const;
const columns = ["status", "name", "window", "coverage", "rule", "actions"] as const;

/**
 * Every sale, running ones first (the API's order), with what it covers and its price rule.
 * An ended sale can only be duplicated or deleted: editing it would not bring it back.
 */
export function SaleList({
  sales,
  isLoading,
  failed,
  designTargets,
  serviceTargets,
  canWrite,
  createButton,
  onEdit,
  onEnd,
  onDuplicate,
  onDelete,
}: Readonly<{
  sales: ReadonlyArray<AdminSale>;
  isLoading: boolean;
  failed: boolean;
  designTargets: ReadonlyArray<SaleTarget>;
  serviceTargets: ReadonlyArray<SaleTarget>;
  canWrite: boolean;
  createButton: ReactNode;
  onEdit: (sale: AdminSale) => void;
  onEnd: (sale: AdminSale) => void;
  onDuplicate: (sale: AdminSale) => void;
  onDelete: (sale: AdminSale) => void;
}>) {
  const t = useTranslations("admin.sales");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SaleListStatus>("ALL");
  const visible = filterSales(sales, query, status);
  const clear = () => {
    setQuery("");
    setStatus("ALL");
  };
  const counts = { ALL: sales.length, ACTIVE: 0, UPCOMING: 0, ENDED: 0 };
  for (const sale of sales) counts[sale.status]++;
  const actions = [
    { key: "edit", Icon: PencilSquareIcon, onPress: onEdit },
    { key: "end", Icon: StopCircleIcon, onPress: onEnd },
    { key: "duplicate", Icon: DocumentDuplicateIcon, onPress: onDuplicate },
    { key: "delete", Icon: TrashIcon, onPress: onDelete },
  ] as const;
  const tokyo = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isLoading) return <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>;
  if (failed) return <p role="alert" className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>;
  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-admin-border bg-admin-surface px-4 py-12 text-center">
        <p role="status" className="max-w-md text-sm text-admin-muted">{t("empty")}</p>
        {createButton}
      </div>
    );
  }

  const coverage = (sale: AdminSale) => {
    const lowered = saleLoweredCounts(sale, designTargets, serviceTargets);
    return [
      sale.designs.mode === "NONE" ? null : t("list.coverageDesigns", { count: lowered.designs }),
      sale.services.mode === "NONE" ? null : t("list.coverageServices", { count: lowered.services }),
    ].filter(Boolean).join(" · ");
  };

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div role="group" aria-label={t("list.filterStatus")} className="flex flex-wrap gap-2">
          {statuses.map(value => (
            <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}
              className={`min-h-11 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${status === value ? "border-admin-accent bg-admin-soft text-admin-accent" : "border-admin-border bg-admin-surface text-admin-muted"}`}>
              {value === "ALL" ? t("list.all") : t(`status.${value}`)}
              <span className="ml-2 tabular-nums">{counts[value]}</span>
            </button>
          ))}
        </div>
        <AdminSearchField label={t("list.search")} placeholder={t("list.search")} value={query} onChange={setQuery} />
      </div>
      <p role="status" className="text-xs text-admin-muted">{t("list.results", { count: visible.length, total: sales.length })}</p>
      {visible.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-admin-border bg-admin-surface p-8 text-center">
          <p className="text-sm text-admin-muted">{t("list.noMatch")}</p>
          <Button variant="outline" onPress={clear}>{t("list.clearFilters")}</Button>
        </div>
      ) : (
        <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
          <Card.Content className="min-w-0 overflow-x-auto p-0">
            <table className="block w-full text-left text-sm xl:table">
              <caption className="sr-only">{t("list.caption")}</caption>
              <thead className="sr-only border-b border-admin-border bg-admin-soft/60 text-xs font-semibold text-admin-ink xl:not-sr-only xl:table-header-group">
                <tr>
                  {columns.map(column => (
                    <AdminSortableHeader key={column} className={column === "status" ? "px-4" : "px-3"}>
                      {t(`list.columns.${column}`)}
                    </AdminSortableHeader>
                  ))}
                </tr>
              </thead>
              <tbody className="block divide-y divide-admin-border xl:table-row-group">
                {visible.map((sale) => {
                  const endedEarly = sale.endedAt !== null && new Date(sale.endedAt) < new Date(sale.endsAt);
                  return (
                    <tr key={sale.id} className="grid gap-1 p-4 sm:grid-cols-2 xl:table-row xl:p-0">
                      <td className="block xl:table-cell xl:px-4 xl:py-2">
                        <Chip size="sm" variant="soft" color={statusColor[sale.status]}>
                          <Chip.Label>{t(`status.${sale.status}`)}</Chip.Label>
                        </Chip>
                      </td>
                      <td className="block break-words font-semibold text-admin-ink xl:table-cell xl:px-3 xl:py-2">{sale.name}</td>
                      <td className="block py-1 tabular-nums text-admin-ink xl:table-cell xl:px-3 xl:py-2">
                        <span className="block text-xs text-admin-muted xl:hidden">{t("list.columns.window")}</span>
                        {tokyo.formatRange(new Date(sale.startsAt), new Date(sale.endsAt))}
                        {endedEarly && sale.endedAt ? (
                          <span className="block text-xs text-admin-muted">
                            {t("list.endedEarly", { time: tokyo.format(new Date(sale.endedAt)) })}
                          </span>
                        ) : null}
                      </td>
                      <td className="block py-1 text-admin-ink xl:table-cell xl:px-3 xl:py-2"><span className="block text-xs text-admin-muted xl:hidden">{t("list.columns.coverage")}</span>{coverage(sale)}</td>
                      <td className="block py-1 font-semibold text-admin-accent xl:table-cell xl:px-3 xl:py-2">
                        {describeSaleRule(sale.rule, formatMoney, (key, values) => t(`rule.${key}`, values))}
                      </td>
                      <td className="block border-t border-admin-border pt-3 sm:col-span-2 xl:table-cell xl:border-0 xl:px-3 xl:py-2">
                        <div className="flex flex-wrap gap-1">
                          {actions.map(({ key, Icon, onPress }) => {
                            if (sale.status === "ENDED" && (key === "edit" || key === "end")) return null;
                            return (
                              <Button key={key} size="sm" variant="ghost"
                                className={`rounded-lg ${key === "delete" ? "text-admin-danger" : ""}`}
                                aria-label={t(`list.${key}Label`, { name: sale.name })}
                                isDisabled={!canWrite} onPress={() => onPress(sale)}>
                                <Icon className="size-4" />{t(`list.${key}`)}
                              </Button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
