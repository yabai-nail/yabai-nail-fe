"use client";

import { ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import { Button, Card, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { formatMoney } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminBranch,
  useAdminPayroll,
  useAdminPermission,
  useAdminReportExport,
  type AdminPayrollRow,
  type AdminReportExport,
} from "@/service";
import { exportStatusLabel } from "../AdminReports/data";
import { currentMonth, formatPeriod, isMonth, payrollErrorKey, shiftMonth } from "./data";

type Confirm = { readonly kind: "pay" | "unlock"; readonly row: AdminPayrollRow };
type ExportKind = "PAYROLL_MONTHLY" | "SALES_REPORTS_MONTHLY";

/**
 * The month's payroll for the active branch, computed live from approved reports. Marking a
 * technician paid snapshots the month and locks their reports; only the owner can unlock.
 * Both Excel exports go through the same export queue as the other reports.
 */
export function AdminPayrollComponent() {
  const t = useTranslations("admin.payroll");
  const tr = useTranslations("admin.reports");
  const canPay = useAdminPermission("payroll.pay.branch");
  const canUnlock = useAdminPermission("payroll.unlock.all");
  const canExport = useAdminPermission("report.export.all");
  const { branchId } = useAdminBranch();
  const [period, setPeriod] = useState(() => currentMonth());
  const sheet = useAdminPayroll(branchId && isMonth(period) ? { branchId, period } : null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportInfo, setExportInfo] = useState<AdminReportExport | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const exportStatus = useAdminReportExport(exportInfo?.exportId ?? null);

  const explain = (thrown: unknown): string => {
    const key = payrollErrorKey(thrown);
    if (key) return t(`errors.${key}`);
    return thrown instanceof Error && thrown.message ? thrown.message : t("actionFailed");
  };

  const run = async (action: Confirm) => {
    if (!branchId) return;
    setBusy(action.row.staffId);
    setActionError(null);
    try {
      if (action.kind === "pay") {
        await adminService.markPayrollPaid(branchId, action.row.staffId, period);
        notifySuccess(t("paid", { name: action.row.displayName }));
      } else {
        await adminService.unlockPayroll(branchId, action.row.staffId, period);
        notifySuccess(t("unlocked", { name: action.row.displayName }));
      }
      void sheet.mutate();
    } catch (thrown) {
      setActionError(explain(thrown));
    } finally {
      setBusy(null);
    }
  };

  const createExport = async (reportType: ExportKind) => {
    if (!branchId) return;
    setBusy(reportType);
    setActionError(null);
    setDownloadUrl(null);
    try {
      const info = await adminService.createReportExport({ reportType, format: "XLSX", filters: { branchId, period } });
      notifySuccess(t("exportQueued"));
      setExportInfo(info);
    } catch (thrown) {
      setActionError(explain(thrown));
    } finally {
      setBusy(null);
    }
  };

  const fetchDownloadUrl = async () => {
    if (!exportInfo) return;
    setActionError(null);
    try {
      const result = await adminService.reportExportDownloadUrl(exportInfo.exportId);
      setDownloadUrl(result.signedUrl);
    } catch (thrown) {
      setActionError(explain(thrown));
    }
  };

  const rows = sheet.data?.rows ?? [];
  const totals = sheet.data?.totals;
  const statusClass = (status: AdminPayrollRow["status"]) =>
    status === "PAID" ? "bg-admin-soft text-admin-accent" : status === "UNLOCKED" ? "bg-admin-soft text-admin-danger" : "bg-admin-soft text-admin-muted";
  const exportReady = exportStatus.data?.status === "READY";

  return (
    <AdminPageLayout>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button isIconOnly variant="ghost" aria-label={t("previousMonth")} onPress={() => setPeriod(shiftMonth(period, -1))}><ChevronLeftIcon className="size-4" /></Button>
          <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} aria-label={t("month")} className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-ink" />
          <Button isIconOnly variant="ghost" aria-label={t("nextMonth")} onPress={() => setPeriod(shiftMonth(period, 1))}><ChevronRightIcon className="size-4" /></Button>
        </div>
        {canExport ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-lg" isDisabled={!branchId || busy !== null} onPress={() => void createExport("PAYROLL_MONTHLY")}>
              <ArrowDownTrayIcon className="size-4" />{t("exportSheet")}
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg" isDisabled={!branchId || busy !== null} onPress={() => void createExport("SALES_REPORTS_MONTHLY")}>
              <ArrowDownTrayIcon className="size-4" />{t("exportDetails")}
            </Button>
            {exportInfo ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                {t("exportLine", { status: exportStatusLabel((exportStatus.data?.status as string | undefined) ?? exportInfo.status, tr) })}
                <button type="button" className="underline" onClick={() => void exportStatus.mutate()}>{t("refresh")}</button>
              </span>
            ) : null}
            {downloadUrl ? (
              <a href={downloadUrl} target="_blank" rel="noreferrer" className="min-h-9 rounded-lg border border-admin-accent px-3 py-1.5 text-xs font-semibold text-admin-accent">{t("download")}</a>
            ) : exportInfo && exportReady ? (
              <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => void fetchDownloadUrl()}>{t("getLink")}</Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {actionError ? <p role="alert" className="mb-3 rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-danger">{actionError}</p> : null}
      {sheet.isLoading ? <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p> : sheet.error ? <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p> : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="flex flex-row items-center justify-between border-b border-admin-border px-4 py-3">
          <h2 className="font-bold text-admin-ink">{t("heading", { period: formatPeriod(period) })}</h2>
          <span className="text-xs text-admin-muted">{t("headingHint")}</span>
        </Card.Header>
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-3 py-3">{t("columns.staff")}</th>
                <th className="px-3 py-3 text-right">{t("columns.approvedCount")}</th>
                <th className="px-3 py-3 text-right">{t("columns.gross")}</th>
                <th className="px-3 py-3 text-right">{t("columns.fee")}</th>
                <th className="px-3 py-3 text-right">{t("columns.staffTotal")}</th>
                <th className="px-3 py-3 text-right">{t("columns.salonTotal")}</th>
                <th className="px-3 py-3 text-right">{t("columns.baseSalary")}</th>
                <th className="px-3 py-3 text-right">{t("columns.payable")}</th>
                <th className="px-3 py-3">{t("columns.status")}</th>
                <th className="px-3 py-3 text-right">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-admin-muted">{t("empty")}</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.staffId} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-3 text-admin-ink">
                      <div className="font-medium">{row.displayName}</div>
                      {!row.active ? <div className="text-xs text-admin-muted">{t("inactive")}</div> : null}
                    </td>
                    <td className="px-3 py-3 text-right text-admin-ink">{row.approvedCount}</td>
                    <td className="px-3 py-3 text-right text-admin-ink">{formatMoney(row.grossTotal)}</td>
                    <td className="px-3 py-3 text-right text-admin-muted">{formatMoney(row.feeTotal)}</td>
                    <td className="px-3 py-3 text-right text-admin-accent">{formatMoney(row.staffTotal)}</td>
                    <td className="px-3 py-3 text-right text-admin-ink">{formatMoney(row.salonTotal)}</td>
                    <td className="px-3 py-3 text-right text-admin-muted">{formatMoney(row.baseSalary)}</td>
                    <td className="px-3 py-3 text-right font-bold text-admin-ink">{formatMoney(row.payable)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}>{t(`status.${row.status}`)}</span>
                      {row.paidAt ? <div className="mt-1 text-xs text-admin-muted">{t("paidOn", { date: row.paidAt.slice(0, 10) })}</div> : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        {canPay && row.status !== "PAID" ? (
                          <Button size="sm" variant="primary" className="rounded-lg" isDisabled={busy !== null} onPress={() => setConfirm({ kind: "pay", row })}>{t("actions.pay")}</Button>
                        ) : null}
                        {canUnlock && row.status === "PAID" ? (
                          <Button size="sm" variant="outline" className="rounded-lg" isDisabled={busy !== null} onPress={() => setConfirm({ kind: "unlock", row })}>
                            <LockOpenIcon className="size-4" />{t("actions.unlock")}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {totals ? (
              <tfoot>
                <tr className="border-t border-admin-border bg-admin-soft text-sm font-semibold text-admin-ink">
                  <td className="px-3 py-3">{t("totals")}</td>
                  <td className="px-3 py-3 text-right">{totals.approvedCount}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(totals.grossTotal)}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(totals.feeTotal)}</td>
                  <td className="px-3 py-3 text-right text-admin-accent">{formatMoney(totals.staffTotal)}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(totals.salonTotal)}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(totals.baseSalary)}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(totals.payable)}</td>
                  <td className="px-3 py-3" colSpan={2}></td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </Card.Content>
      </Card>

      {confirm ? (
        <Modal isOpen onOpenChange={(open) => { if (!open && busy === null) setConfirm(null); }}>
          <Modal.Backdrop>
            <Modal.Container size="sm" placement="center">
              <Modal.Dialog>
                <Modal.Header className="border-b border-admin-border px-5 py-4">
                  <Modal.Heading className="text-base font-bold text-admin-ink">{t(`confirm.${confirm.kind}.title`)}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="space-y-2 px-5 py-4 text-sm text-admin-ink">
                  <p>{t(`confirm.${confirm.kind}.body`, { name: confirm.row.displayName, period: formatPeriod(period), payable: formatMoney(confirm.row.payable) })}</p>
                  <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs text-admin-muted">{t(`confirm.${confirm.kind}.hint`)}</p>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
                  <Button variant="ghost" className="rounded-lg" isDisabled={busy !== null} onPress={() => setConfirm(null)}>{t("confirm.cancel")}</Button>
                  <Button variant="primary" className="rounded-lg" isDisabled={busy !== null} onPress={() => { const action = confirm; setConfirm(null); void run(action); }}>
                    {t(`confirm.${confirm.kind}.action`)}
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
