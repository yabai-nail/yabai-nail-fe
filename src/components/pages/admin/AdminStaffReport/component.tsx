"use client";

import { ChevronLeftIcon, ChevronRightIcon, LockClosedIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { formatMoney } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import { ApiClientError, adminService, useAdminBranch, useAdminBranchList, useAdminSalesReports, type AdminSalesReport } from "@/service";
import { formatPeriod, shiftMonth } from "../AdminPayroll/data";
import { REPORT_FETCH_LIMIT, currentMonth, isMonth, monthBounds, reportErrorKey, summarize } from "../AdminSalesReports/data";
import { ReportModal } from "../AdminSalesReports/ReportModal";
import { groupByDay } from "./data";

/**
 * The technician's own screen, one column and big targets for a phone at the end of a job:
 * one button to report the customer just served, then the month's reports by day with what
 * each one pays, its status, and the manager's reason when one was rejected. Pending reports
 * can be corrected or withdrawn; decided ones are read-only.
 */
export function AdminStaffReportComponent() {
  const t = useTranslations("admin.staffReport");
  const tl = useTranslations("admin.salesReports");
  const { branchId } = useAdminBranch();
  const branches = useAdminBranchList();
  const timeZone = branches.data?.items.find((branch) => branch.id === branchId)?.timezone;
  const [period, setPeriod] = useState(() => currentMonth());
  const bounds = isMonth(period) ? monthBounds(period) : null;
  const query = bounds ? { staffId: "me", from: bounds.from, to: bounds.to, limit: REPORT_FETCH_LIMIT } : undefined;
  const { data, isLoading, error, mutate } = useAdminSalesReports(query, Boolean(query));
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminSalesReport | null>(null);
  const [deleting, setDeleting] = useState<AdminSalesReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  const groups = useMemo(() => groupByDay(items), [items]);
  const summary = summarize(items);
  const noProfile = error instanceof ApiClientError && error.code === "STAFF_PROFILE_REQUIRED";

  const remove = async (row: AdminSalesReport) => {
    setBusy(true);
    setActionError(null);
    try {
      await adminService.deleteSalesReport(row.id, row.version);
      notifySuccess(t("deleted"));
      void mutate();
    } catch (thrown) {
      const key = reportErrorKey(thrown);
      setActionError(key ? tl(`errors.${key}`) : thrown instanceof Error && thrown.message ? thrown.message : t("deleteFailed"));
    } finally {
      setBusy(false);
    }
  };

  const statusClass = (code: string) =>
    code === "APPROVED" ? "bg-admin-soft text-admin-accent" : code === "REJECTED" ? "bg-admin-soft text-admin-danger" : "bg-admin-soft text-admin-muted";

  return (
    <AdminPageLayout>
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Button variant="primary" className="min-h-14 w-full rounded-xl text-base" isDisabled={noProfile} onPress={() => setCreating(true)}>
          <PlusIcon className="size-5" />{t("newReport")}
        </Button>

        <div className="flex items-center justify-between gap-2">
          <Button isIconOnly variant="ghost" aria-label={t("previousMonth")} onPress={() => setPeriod(shiftMonth(period, -1))}><ChevronLeftIcon className="size-5" /></Button>
          <div className="text-center">
            <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} aria-label={t("month")} className="min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-base font-semibold text-admin-ink" />
            <p className="mt-1 text-xs text-admin-muted">{t("summary", { count: summary.count, mine: formatMoney(summary.staffTotal) })}</p>
          </div>
          <Button isIconOnly variant="ghost" aria-label={t("nextMonth")} onPress={() => setPeriod(shiftMonth(period, 1))}><ChevronRightIcon className="size-5" /></Button>
        </div>

        {actionError ? <p role="alert" className="rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-danger">{actionError}</p> : null}
        {isLoading ? (
          <p className="text-center text-sm text-admin-muted">{t("loading")}</p>
        ) : noProfile ? (
          <p role="alert" className="rounded-lg bg-admin-soft px-4 py-3 text-sm text-admin-danger">{t("noProfile")}</p>
        ) : error ? (
          <p role="alert" className="text-center text-sm text-admin-danger">{t("loadFailed")}</p>
        ) : groups.length === 0 ? (
          <p className="rounded-xl border border-admin-border p-6 text-center text-sm text-admin-muted">{t("empty", { period: formatPeriod(period) })}</p>
        ) : (
          groups.map((group) => (
            <section key={group.date} aria-label={group.date} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-sm font-bold text-admin-ink">{group.date}</h2>
                <span className="text-xs text-admin-muted">{t("dayTotal", { count: group.rows.length, mine: formatMoney(group.mine) })}</span>
              </div>
              {group.rows.map((row) => {
                const editable = row.status === "PENDING" && !row.locked;
                return (
                  <Card key={row.id} className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
                    <Card.Content className="flex flex-col gap-2 px-4 py-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-admin-ink">{tl(`platform.${row.platform}`)}{row.servedAt ? <span className="font-normal text-admin-muted"> · {row.servedAt}</span> : null}</p>
                          <p className="text-xs text-admin-muted">{t("gross")}: {formatMoney(row.grossAmount)} · {tl(`paymentMethod.${row.paymentMethod}`)}{row.platformFee ? ` · ${t("fee")}: ${formatMoney(row.platformFee)}` : ""}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-lg font-bold ${row.staffAmount < 0 ? "text-admin-danger" : "text-admin-accent"}`}>{formatMoney(row.staffAmount)}</p>
                          <p className="text-xs text-admin-muted">{t("mine", { rate: row.staffRatePercent })}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                          {row.locked ? <LockClosedIcon aria-label={tl("locked")} className="size-3" /> : null}
                          {tl(`status.${row.status}`)}
                        </span>
                        {editable ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="rounded-lg" isDisabled={busy} onPress={() => setEditing(row)}><PencilSquareIcon className="size-4" />{t("edit")}</Button>
                            <Button size="sm" variant="ghost" className="rounded-lg text-admin-danger" isDisabled={busy} onPress={() => setDeleting(row)}><TrashIcon className="size-4" />{t("delete")}</Button>
                          </div>
                        ) : null}
                      </div>
                      {row.rejectionReason ? <p className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-danger">{t("rejectedBecause", { reason: row.rejectionReason })}</p> : null}
                      {row.note ? <p className="text-xs text-admin-muted">{row.note}</p> : null}
                    </Card.Content>
                  </Card>
                );
              })}
            </section>
          ))
        )}
      </div>

      {creating ? <ReportModal report={null} staffOptions={[]} timeZone={timeZone} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <ReportModal report={editing} staffOptions={[]} timeZone={timeZone} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
      {deleting ? (
        <Modal isOpen onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}>
          <Modal.Backdrop>
            <Modal.Container size="sm" placement="center">
              <Modal.Dialog>
                <Modal.Header className="border-b border-admin-border px-5 py-4">
                  <Modal.Heading className="text-base font-bold text-admin-ink">{t("confirmDelete.title")}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="px-5 py-4 text-sm text-admin-ink">
                  {t("confirmDelete.body", { date: deleting.reportDate, amount: formatMoney(deleting.grossAmount) })}
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
                  <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={() => setDeleting(null)}>{t("confirmDelete.cancel")}</Button>
                  <Button variant="ghost" className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90" isDisabled={busy} onPress={() => { const row = deleting; setDeleting(null); void remove(row); }}>
                    {t("confirmDelete.action")}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}
    </AdminPageLayout>
  );
}
