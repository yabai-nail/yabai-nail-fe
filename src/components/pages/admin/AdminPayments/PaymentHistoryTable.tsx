"use client";

import { Button, Card } from "@heroui/react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useFormatter, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import { SALON_TIME_ZONE } from "@/lib/salon-date";
import type { AdminPaymentHistoryItem, AdminPaymentSettlementStatus } from "@/service";

function statusClass(status: AdminPaymentSettlementStatus): string {
  return status === "PAID"
    ? "bg-emerald-50 text-emerald-700"
    : status === "PARTIALLY_REFUNDED"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-700";
}

export function PaymentHistoryTable({ items, timeZone = SALON_TIME_ZONE, onSelect }: {
  readonly items: ReadonlyArray<AdminPaymentHistoryItem>;
  readonly timeZone?: string;
  readonly onSelect: (paymentId: string) => void;
}) {
  const t = useTranslations("admin.payments.history");
  const format = useFormatter();
  const statusLabel = (status: AdminPaymentSettlementStatus) => status === "PAID" ? t("paid") : status === "PARTIALLY_REFUNDED" ? t("partiallyRefunded") : t("refunded");
  const paidAt = (value: string) => format.dateTime(new Date(value), { timeZone, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

  if (!items.length) return <p className="px-4 py-12 text-center text-sm text-admin-muted">{t("empty")}</p>;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead><tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
            <th className="px-4 py-3">{t("columns.time")}</th><th className="px-4 py-3">{t("columns.customer")}</th><th className="px-4 py-3">{t("columns.services")}</th><th className="px-4 py-3">{t("columns.method")}</th><th className="px-4 py-3 text-right">{t("columns.amount")}</th><th className="px-4 py-3">{t("columns.status")}</th><th className="px-4 py-3"><span className="sr-only">{t("viewDetail")}</span></th>
          </tr></thead>
          <tbody>{items.map((item) => <tr key={item.id} className="border-b border-admin-border last:border-0 hover:bg-admin-soft/50">
            <td className="whitespace-nowrap px-4 py-3 text-admin-muted">{paidAt(item.paidAt)}</td>
            <td className="px-4 py-3"><strong className="block text-admin-ink">{item.customer.displayName || "—"}</strong><span className="text-xs text-admin-muted">{item.customer.phone || `#${item.appointmentId.slice(0, 8)}`}</span></td>
            <td className="max-w-56 px-4 py-3 text-admin-ink"><span className="line-clamp-2">{item.services.map((service) => service.name).join(", ") || "—"}</span></td>
            <td className="px-4 py-3 font-medium text-admin-ink">{item.method}</td>
            <td className="whitespace-nowrap px-4 py-3 text-right"><strong className="text-admin-ink">{formatMoney(item.amount)}</strong>{item.refundedAmount ? <span className="block text-xs text-admin-danger">−{formatMoney(item.refundedAmount)}</span> : null}</td>
            <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.settlementStatus)}`}>{statusLabel(item.settlementStatus)}</span></td>
            <td className="px-4 py-3 text-right"><Button size="sm" variant="secondary" className="rounded-lg" onPress={() => onSelect(item.id)}><EyeIcon className="size-4" />{t("viewDetail")}</Button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">{items.map((item) => <Card key={item.id} className="gap-3 rounded-xl border-admin-border bg-admin-surface p-4 shadow-none">
        <div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-admin-ink">{item.customer.displayName || "—"}</strong><p className="mt-1 text-xs text-admin-muted">{paidAt(item.paidAt)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.settlementStatus)}`}>{statusLabel(item.settlementStatus)}</span></div>
        <p className="line-clamp-2 text-sm text-admin-muted">{item.services.map((service) => service.name).join(", ") || "—"}</p>
        <div className="flex items-end justify-between gap-3"><div><strong className="text-lg text-admin-ink">{formatMoney(item.amount)}</strong><span className="ml-2 text-xs text-admin-muted">{item.method}</span></div><Button size="sm" variant="secondary" className="rounded-lg" onPress={() => onSelect(item.id)}>{t("viewDetail")}</Button></div>
      </Card>)}</div>
    </>
  );
}
