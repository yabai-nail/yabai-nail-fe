"use client";

import { DocumentDuplicateIcon, PencilSquareIcon, StopCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { formatMoney } from "@/lib/admin-format";
import type { AdminSale } from "@/service";
import { describeSaleRule, saleCoverage, type SaleTarget } from "./data";

const statusColor = { ACTIVE: "success", UPCOMING: "warning", ENDED: "default" } as const;

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
    const covered = saleCoverage(sale, designTargets, serviceTargets);
    return [
      sale.designs.mode === "NONE" ? null : t("list.coverageDesigns", { count: covered.designs.length }),
      sale.services.mode === "NONE" ? null : t("list.coverageServices", { count: covered.services.length }),
    ].filter(Boolean).join(" · ");
  };
  const action = (label: string, icon: ReactNode, onPress: () => void, danger = false) => (
    <Button
      size="sm"
      variant="ghost"
      className={`rounded-lg ${danger ? "text-admin-danger" : ""}`}
      aria-label={label}
      isDisabled={!canWrite}
      onPress={onPress}
    >
      {icon}
    </Button>
  );

  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Content className="min-w-0 overflow-x-auto p-0">
        <table className="w-full min-w-[960px] text-left text-sm">
          <caption className="sr-only">{t("list.caption")}</caption>
          <thead className="border-b border-admin-border bg-admin-soft/60 text-xs font-semibold text-admin-ink">
            <tr>
              <AdminSortableHeader className="px-4">{t("list.columns.status")}</AdminSortableHeader>
              <AdminSortableHeader>{t("list.columns.name")}</AdminSortableHeader>
              <AdminSortableHeader>{t("list.columns.window")}</AdminSortableHeader>
              <AdminSortableHeader>{t("list.columns.coverage")}</AdminSortableHeader>
              <AdminSortableHeader>{t("list.columns.rule")}</AdminSortableHeader>
              <AdminSortableHeader>{t("list.columns.actions")}</AdminSortableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {sales.map((sale) => {
              const endedEarly = sale.endedAt !== null && new Date(sale.endedAt) < new Date(sale.endsAt);
              return (
                <tr key={sale.id}>
                  <td className="whitespace-nowrap px-4 py-2">
                    <Chip size="sm" variant="soft" color={statusColor[sale.status]}>
                      <Chip.Label>{t(`status.${sale.status}`)}</Chip.Label>
                    </Chip>
                  </td>
                  <td className="px-3 py-2 font-medium text-admin-ink">{sale.name}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-admin-ink">
                    {tokyo.formatRange(new Date(sale.startsAt), new Date(sale.endsAt))}
                    {endedEarly && sale.endedAt ? (
                      <span className="block text-xs text-admin-muted">
                        {t("list.endedEarly", { time: tokyo.format(new Date(sale.endedAt)) })}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-admin-ink">{coverage(sale)}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-admin-ink">
                    {describeSaleRule(sale.rule, formatMoney, (key, values) => t(`rule.${key}`, values))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex gap-1">
                      {sale.status === "ENDED" ? null : (
                        <>
                          {action(t("list.editLabel", { name: sale.name }), <><PencilSquareIcon className="size-4" />{t("list.edit")}</>, () => onEdit(sale))}
                          {action(t("list.endLabel", { name: sale.name }), <><StopCircleIcon className="size-4" />{t("list.end")}</>, () => onEnd(sale))}
                        </>
                      )}
                      {action(t("list.duplicateLabel", { name: sale.name }), <><DocumentDuplicateIcon className="size-4" />{t("list.duplicate")}</>, () => onDuplicate(sale))}
                      {action(t("list.deleteLabel", { name: sale.name }), <><TrashIcon className="size-4" />{t("list.delete")}</>, () => onDelete(sale), true)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card.Content>
    </Card>
  );
}
