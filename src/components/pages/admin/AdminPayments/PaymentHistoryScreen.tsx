"use client";

import { Button, Card } from "@heroui/react";
import { ArrowPathIcon, BanknotesIcon, ReceiptPercentIcon, WalletIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { formatMoney } from "@/lib/admin-format";
import { SALON_TIME_ZONE, zonedIso } from "@/lib/salon-date";
import { useAdminBranch, useAdminBranchDetail, useAdminPayments, useAdminPermission } from "@/service";
import { PaymentHistoryDetailModal } from "./PaymentHistoryDetailModal";
import { PaymentHistoryTable } from "./PaymentHistoryTable";

const PAGE_SIZE = 10;
function nextDate(date: string): string { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + 1); return value.toISOString().slice(0, 10); }

export function PaymentHistoryScreen() {
  const t = useTranslations("admin.payments.history");
  const { branchId } = useAdminBranch();
  const canRead = useAdminPermission("payment.read.branch");
  const branch = useAdminBranchDetail(branchId);
  const timeZone = branch.data?.timezone ?? SALON_TIME_ZONE;
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const query = useMemo(() => ({ q: search.trim() || undefined, method: method === "ALL" ? undefined : method, from: fromDate ? zonedIso(fromDate, "00:00", timeZone) : undefined, to: toDate ? zonedIso(nextDate(toDate), "00:00", timeZone) : undefined, limit: 100 }), [fromDate, method, search, timeZone, toDate]);
  const payments = useAdminPayments(canRead ? branchId : null, query);
  const items = useMemo(() => payments.data?.items ?? [], [payments.data?.items]);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totals = useMemo(() => ({ collected: items.reduce((sum, item) => sum + item.amount, 0), refunded: items.reduce((sum, item) => sum + item.refundedAmount, 0), net: items.reduce((sum, item) => sum + item.netAmount, 0) }), [items]);
  const setFilter = (change: () => void) => { change(); setPage(1); };
  const clear = () => { setSearch(""); setMethod("ALL"); setFromDate(""); setToDate(""); setPage(1); };
  const summary = [[t("summaryTransactions"), String(items.length), ReceiptPercentIcon], [t("summaryCollected"), formatMoney(totals.collected), BanknotesIcon], [t("summaryRefunded"), formatMoney(totals.refunded), ArrowPathIcon], [t("summaryNet"), formatMoney(totals.net), WalletIcon]] as const;

  return <AdminPageLayout>
    <div className="mb-5"><h1 className="text-xl font-bold text-admin-ink">{t("title")}</h1><p className="mt-1 text-sm text-admin-muted">{t("description")}</p></div>
    {!canRead ? <p role="alert" className="rounded-xl border border-admin-border bg-admin-surface px-4 py-8 text-center text-sm text-admin-muted">{t("noPermission")}</p> : <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summary.map(([label, value, Icon]) => <Card key={label} className="flex-row items-center gap-3 rounded-xl border-admin-border bg-admin-surface p-4 shadow-none"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-admin-soft text-admin-accent"><Icon className="size-5" /></span><div><p className="text-xs font-medium text-admin-muted">{label}</p><strong className="mt-1 block text-lg text-admin-ink">{value}</strong></div></Card>)}</div>
      <Card className="mb-4 gap-3 rounded-xl border-admin-border bg-admin-surface p-4 shadow-none"><div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_12rem_10rem_10rem_auto] xl:items-end">
        <AdminSearchField fullWidth label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={search} onChange={(value) => setFilter(() => setSearch(value))} />
        <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">{t("methodLabel")}<AdminSelectField label={t("methodLabel")} value={method} onChange={(value) => setFilter(() => setMethod(value))} options={[{ value: "ALL", label: t("allMethods") }, { value: "CASH", label: "CASH" }, { value: "PAYPAY", label: "PayPay" }, { value: "VISA", label: "VISA" }]} /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">{t("fromDate")}<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFilter(() => setFromDate(event.target.value))} className="h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent" /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">{t("toDate")}<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setFilter(() => setToDate(event.target.value))} className="h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent" /></label>
        <Button variant="secondary" className="rounded-lg" onPress={clear}>{t("clearFilters")}</Button>
      </div></Card>
      {payments.isLoading ? <p aria-busy="true" className="rounded-xl border border-admin-border bg-admin-surface px-4 py-12 text-center text-sm text-admin-muted">{t("loading")}</p> : payments.error ? <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-8 text-center text-sm text-danger"><p>{t("loadFailed")}</p><Button size="sm" variant="secondary" className="mt-3" onPress={() => void payments.mutate()}>{t("retry")}</Button></div> : <Card className="min-w-0 gap-0 overflow-hidden rounded-xl border-admin-border bg-admin-surface p-0 shadow-none"><PaymentHistoryTable items={visible} timeZone={timeZone} onSelect={setDetailId} /><Card.Footer className="flex flex-col gap-3 border-t border-admin-border px-4 py-3 text-xs text-admin-muted sm:flex-row sm:items-center sm:justify-between"><span>{t("showing", { shown: visible.length, total: items.length })}</span><AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} /></Card.Footer></Card>}
    </>}
    {branchId && detailId ? <PaymentHistoryDetailModal branchId={branchId} paymentId={detailId} timeZone={timeZone} onClose={() => setDetailId(null)} /> : null}
  </AdminPageLayout>;
}
