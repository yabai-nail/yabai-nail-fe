"use client";

import { CheckIcon, LockClosedIcon, PencilSquareIcon, PlusIcon, XMarkIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { formatMoney } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import { SALES_PAYMENT_METHODS, SALES_PLATFORMS } from "@/lib/sales-report-engine";
import { todayAtSalon } from "@/lib/salon-date";
import {
  adminService,
  useAdminBranch,
  useAdminBranchList,
  useAdminPermission,
  useAdminSalesReports,
  useAdminStaff,
  type AdminSalesReport,
  type AdminSalesReportDecision,
} from "@/service";
import { REPORT_FETCH_LIMIT, REPORT_PAGE_SIZE, currentMonth, decidableIds, isMonth, monthBounds, paginate, reportErrorKey, summarize } from "./data";
import { RejectModal } from "./RejectModal";
import { ReportModal } from "./ReportModal";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

interface TailPages {
  readonly key: string;
  readonly items: ReadonlyArray<AdminSalesReport>;
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
}

/**
 * The manager's view of a month of reports for the active branch: filter, read the money,
 * approve or reject one by one or in bulk, and edit or report on someone's behalf. Only
 * approved reports reach payroll, so "approve the whole day" is the button meant for the end
 * of a shift.
 */
export function AdminSalesReportsComponent() {
  const t = useTranslations("admin.salesReports");
  const canApprove = useAdminPermission("sales.report.approve.branch");
  const canWrite = useAdminPermission("sales.report.write.branch");
  const { branchId } = useAdminBranch();
  const branches = useAdminBranchList();
  const timeZone = branches.data?.items.find((branch) => branch.id === branchId)?.timezone;

  const [period, setPeriod] = useState(() => currentMonth());
  const [staffId, setStaffId] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [pages, setPages] = useState<TailPages | null>(null);
  const [editing, setEditing] = useState<AdminSalesReport | null>(null);
  const [creating, setCreating] = useState(false);
  const [rejecting, setRejecting] = useState<ReadonlyArray<AdminSalesReport> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dayToApprove, setDayToApprove] = useState(() => todayAtSalon());

  const staff = useAdminStaff(branchId ? { branchId, limit: 100 } : undefined, Boolean(branchId));
  const staffOptions = useMemo(
    () => (staff.data?.items ?? []).map((member) => ({ id: member.id, name: member.displayName })),
    [staff.data],
  );
  const staffName = (id: string) => staffOptions.find((option) => option.id === id)?.name ?? t("unknownStaff");

  const bounds = isMonth(period) ? monthBounds(period) : null;
  const query = branchId && bounds
    ? {
        branchId,
        from: bounds.from,
        to: bounds.to,
        staffId: staffId === "all" ? undefined : staffId,
        platform: platform === "all" ? undefined : platform,
        status: status === "all" ? undefined : status,
        paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
        limit: REPORT_FETCH_LIMIT,
      }
    : undefined;
  const queryKey = JSON.stringify(query ?? {});
  const { data, isLoading, error, mutate } = useAdminSalesReports(query, Boolean(query));

  // The API pages by cursor and caps a page at 100; the first page comes from SWR, further
  // pages are appended here under the same filter key and dropped the moment a filter changes.
  const tail = pages && pages.key === queryKey ? pages : null;
  const items = useMemo(() => [...(data?.items ?? []), ...(tail?.items ?? [])], [data, tail]);
  const hasNextPage = tail ? tail.hasNextPage : Boolean(data?.pageInfo?.hasNextPage);
  const endCursor = tail ? tail.endCursor : data?.pageInfo?.endCursor ?? null;

  const refresh = () => {
    setPages(null);
    setSelected(new Set());
    void mutate();
  };

  const explain = (thrown: unknown): string => {
    const key = reportErrorKey(thrown);
    if (key) return t(`errors.${key}`);
    return thrown instanceof Error && thrown.message ? thrown.message : t("actionFailed");
  };

  const loadMore = async () => {
    if (!query || !endCursor) return;
    setBusy("more");
    try {
      const next = await adminService.salesReports({ ...query, cursor: endCursor });
      setPages({ key: queryKey, items: [...(tail?.items ?? []), ...next.items], endCursor: next.pageInfo?.endCursor ?? null, hasNextPage: Boolean(next.pageInfo?.hasNextPage) });
    } catch (thrown) {
      setActionError(explain(thrown));
    } finally {
      setBusy(null);
    }
  };

  const decideOne = async (row: AdminSalesReport, decision: AdminSalesReportDecision, reason?: string) => {
    setBusy(row.id);
    setActionError(null);
    try {
      await adminService.decideSalesReport(row.id, { decision, reason }, row.version);
      notifySuccess(t(`decided.${decision}`));
      refresh();
    } catch (thrown) {
      setActionError(explain(thrown));
    } finally {
      setBusy(null);
    }
  };

  const decideMany = async (input: { readonly decision: AdminSalesReportDecision; readonly reason?: string; readonly reportIds?: ReadonlyArray<string>; readonly date?: string }) => {
    if (!branchId) return;
    setBusy("batch");
    setActionError(null);
    try {
      const result = await adminService.decideSalesReports({ ...input, ...(input.reportIds ? {} : { branchId }) });
      notifySuccess(result.skipped.length ? t("batchPartial", { decided: result.decided, skipped: result.skipped.length }) : t("batchDone", { decided: result.decided }));
      refresh();
    } catch (thrown) {
      setActionError(explain(thrown));
    } finally {
      setBusy(null);
    }
  };

  const selectedDecidable = decidableIds(items, selected);
  const { items: visible, page: currentPage, pageCount } = paginate(items, page, REPORT_PAGE_SIZE);
  const summary = summarize(items);
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));
  const toggleVisible = () => {
    const next = new Set(selected);
    if (allVisibleSelected) visible.forEach((row) => next.delete(row.id));
    else visible.forEach((row) => next.add(row.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const statusClass = (code: string) =>
    code === "APPROVED" ? "bg-admin-soft text-admin-accent" : code === "REJECTED" ? "bg-admin-soft text-admin-danger" : "bg-admin-soft text-admin-muted";

  return (
    <AdminPageLayout>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          {t("filters.month")}
          <input type="month" value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); setSelected(new Set()); }} className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink" />
        </label>
        <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          {t("filters.staff")}
          <AdminSelectField label={t("filters.staff")} value={staffId} onChange={(value) => { setStaffId(value); setPage(1); }} fullWidth options={[{ value: "all", label: t("filters.allStaff") }, ...staffOptions.map((option) => ({ value: option.id, label: option.name }))]} />
        </div>
        <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          {t("filters.platform")}
          <AdminSelectField label={t("filters.platform")} value={platform} onChange={(value) => { setPlatform(value); setPage(1); }} fullWidth options={[{ value: "all", label: t("filters.allPlatforms") }, ...SALES_PLATFORMS.map((code) => ({ value: code, label: t(`platform.${code}`) }))]} />
        </div>
        <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          {t("filters.status")}
          <AdminSelectField label={t("filters.status")} value={status} onChange={(value) => { setStatus(value); setPage(1); }} fullWidth options={[{ value: "all", label: t("filters.allStatuses") }, ...STATUSES.map((code) => ({ value: code, label: t(`status.${code}`) }))]} />
        </div>
        <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          {t("filters.paymentMethod")}
          <AdminSelectField label={t("filters.paymentMethod")} value={paymentMethod} onChange={(value) => { setPaymentMethod(value); setPage(1); }} fullWidth options={[{ value: "all", label: t("filters.allPaymentMethods") }, ...SALES_PAYMENT_METHODS.map((code) => ({ value: code, label: t(`paymentMethod.${code}`) }))]} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        {canWrite ? (
          <Button variant="primary" className="rounded-lg" isDisabled={!branchId} onPress={() => setCreating(true)}>
            <PlusIcon className="size-4" />{t("actions.add")}
          </Button>
        ) : null}
        {canApprove ? (
          <>
            <Button variant="outline" className="rounded-lg" isDisabled={selectedDecidable.length === 0 || busy !== null} onPress={() => void decideMany({ decision: "APPROVE", reportIds: selectedDecidable })}>
              <CheckIcon className="size-4" />{t("actions.approveSelected", { count: selectedDecidable.length })}
            </Button>
            <Button variant="outline" className="rounded-lg" isDisabled={selectedDecidable.length === 0 || busy !== null} onPress={() => setRejecting(items.filter((row) => selectedDecidable.includes(row.id)))}>
              <XMarkIcon className="size-4" />{t("actions.rejectSelected", { count: selectedDecidable.length })}
            </Button>
            <label className="ml-auto flex items-end gap-2 text-xs font-semibold text-admin-muted">
              <span className="flex flex-col gap-1">
                {t("actions.dayLabel")}
                <input type="date" value={dayToApprove} onChange={(event) => setDayToApprove(event.target.value)} className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink" />
              </span>
              <Button variant="outline" className="rounded-lg" isDisabled={!branchId || busy !== null || dayToApprove === ""} onPress={() => void decideMany({ decision: "APPROVE", date: dayToApprove })}>
                {t("actions.approveDay")}
              </Button>
            </label>
          </>
        ) : null}
      </div>

      {actionError ? <p role="alert" className="mb-3 rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-danger">{actionError}</p> : null}
      {isLoading ? <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p> : error ? <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p> : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 border-b border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>{t("summary.count", { count: summary.count })}</span>
          <span>{t("summary.gross")}: <strong className="text-admin-ink">{formatMoney(summary.grossTotal)}</strong></span>
          <span>{t("summary.fee")}: <strong className="text-admin-ink">{formatMoney(summary.feeTotal)}</strong></span>
          <span>{t("summary.staff")}: <strong className="text-admin-accent">{formatMoney(summary.staffTotal)}</strong></span>
          <span>{t("summary.salon")}: <strong className="text-admin-ink">{formatMoney(summary.salonTotal)}</strong></span>
        </Card.Header>
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-3 py-3">
                  <input type="checkbox" className="accent-admin-accent" aria-label={t("columns.selectAll")} checked={allVisibleSelected} onChange={toggleVisible} />
                </th>
                <th className="px-3 py-3">{t("columns.date")}</th>
                <th className="px-3 py-3">{t("columns.staff")}</th>
                <th className="px-3 py-3">{t("columns.platform")}</th>
                <th className="px-3 py-3 text-right">{t("columns.gross")}</th>
                <th className="px-3 py-3 text-right">{t("columns.fee")}</th>
                <th className="px-3 py-3 text-right">{t("columns.staffAmount")}</th>
                <th className="px-3 py-3 text-right">{t("columns.salonAmount")}</th>
                <th className="px-3 py-3">{t("columns.paymentMethod")}</th>
                <th className="px-3 py-3">{t("columns.status")}</th>
                <th className="px-3 py-3 text-right">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-admin-muted">{t("empty")}</td></tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-3">
                      <input type="checkbox" className="accent-admin-accent" aria-label={t("columns.select")} checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} />
                    </td>
                    <td className="px-3 py-3 text-admin-ink">
                      <div>{row.reportDate}</div>
                      {row.servedAt ? <div className="text-xs text-admin-muted">{row.servedAt}</div> : null}
                    </td>
                    <td className="px-3 py-3 text-admin-ink">{staffName(row.staffId)}</td>
                    <td className="px-3 py-3 text-admin-muted">
                      <div>{t(`platform.${row.platform}`)}</div>
                      <div className="text-xs">{row.staffRatePercent}%</div>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-admin-ink">{formatMoney(row.grossAmount)}</td>
                    <td className="px-3 py-3 text-right text-admin-muted">{formatMoney(row.platformFee)}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${row.staffAmount < 0 ? "text-admin-danger" : "text-admin-accent"}`}>{formatMoney(row.staffAmount)}</td>
                    <td className="px-3 py-3 text-right text-admin-ink">{formatMoney(row.salonAmount)}</td>
                    <td className="px-3 py-3 text-admin-muted">{t(`paymentMethod.${row.paymentMethod}`)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                        {row.locked ? <LockClosedIcon aria-label={t("locked")} className="size-3" /> : null}
                        {t(`status.${row.status}`)}
                      </span>
                      {row.rejectionReason ? <div className="mt-1 max-w-[16rem] truncate text-xs text-admin-muted" title={row.rejectionReason}>{row.rejectionReason}</div> : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        {canApprove && row.status !== "APPROVED" ? (
                          <Button isIconOnly size="sm" variant="ghost" aria-label={t("actions.approve")} isDisabled={row.locked || busy !== null} onPress={() => void decideOne(row, "APPROVE")}><CheckIcon className="size-4" /></Button>
                        ) : null}
                        {canApprove && row.status !== "REJECTED" ? (
                          <Button isIconOnly size="sm" variant="ghost" aria-label={t("actions.reject")} isDisabled={row.locked || busy !== null} onPress={() => setRejecting([row])}><XMarkIcon className="size-4" /></Button>
                        ) : null}
                        {canApprove && row.status !== "PENDING" ? (
                          <Button isIconOnly size="sm" variant="ghost" aria-label={t("actions.reopen")} isDisabled={row.locked || busy !== null} onPress={() => void decideOne(row, "PENDING")}><ArrowUturnLeftIcon className="size-4" /></Button>
                        ) : null}
                        {canWrite ? (
                          <Button isIconOnly size="sm" variant="ghost" aria-label={t("actions.edit")} isDisabled={row.locked || busy !== null} onPress={() => setEditing(row)}><PencilSquareIcon className="size-4" /></Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>{t("pagination", { shown: visible.length, total: items.length })}</span>
          <div className="flex items-center gap-3">
            {hasNextPage ? (
              <Button size="sm" variant="outline" className="rounded-lg" isDisabled={busy !== null} onPress={() => void loadMore()}>{t("actions.loadMore")}</Button>
            ) : null}
            <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        </Card.Footer>
      </Card>

      {creating ? <ReportModal report={null} staffOptions={staffOptions} timeZone={timeZone} onClose={() => setCreating(false)} onSaved={refresh} /> : null}
      {editing ? <ReportModal report={editing} staffOptions={staffOptions} timeZone={timeZone} onClose={() => setEditing(null)} onSaved={refresh} /> : null}
      {rejecting ? (
        <RejectModal
          count={rejecting.length}
          busy={busy !== null}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) => {
            const targets = rejecting;
            setRejecting(null);
            if (targets.length === 1) void decideOne(targets[0], "REJECT", reason);
            else void decideMany({ decision: "REJECT", reason, reportIds: targets.map((row) => row.id) });
          }}
        />
      ) : null}
    </AdminPageLayout>
  );
}
