"use client";

import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import {
  adminService,
  useAdminBranchesReport,
  useAdminCustomersReport,
  useAdminReportExport,
  useAdminStaffPerformanceReport,
  useRevenueReport,
  type AdminReportExport,
} from "@/service";
import {
  exportKindOf,
  formatReportValue,
  labelForKey,
  metricCards,
  reportKindLabels,
  reportRowsFixture,
  revenueFixture,
  tableColumns,
  type ReportKind,
} from "./data";

const kinds: ReadonlyArray<ReportKind> = ["revenue", "branches", "customers", "staff"];

export function AdminReportsComponent() {
  const revenue = useRevenueReport();
  const branches = useAdminBranchesReport();
  const customers = useAdminCustomersReport();
  const staff = useAdminStaffPerformanceReport();

  const [kind, setKind] = useState<ReportKind>("revenue");
  const [exportInfo, setExportInfo] = useState<AdminReportExport | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Live status of the created export, by id — a build can still be running when
  // the create call returns, so the row reflects the freshest read.
  const exportStatus = useAdminReportExport(exportInfo?.id ?? null);

  const reportByKind = { revenue, branches, customers, staff } as const;
  const active = reportByKind[kind];

  const cards = useMemo(
    () => metricCards(revenue.data ?? (revenue.isLoading ? undefined : revenueFixture)),
    [revenue.data, revenue.isLoading],
  );

  const rows = useMemo<ReadonlyArray<Record<string, unknown>>>(() => {
    if (kind === "revenue") {
      return (revenue.data?.rows ?? (revenue.data ? [] : revenueFixture.rows)) as ReadonlyArray<Record<string, unknown>>;
    }
    const report = active.data;
    if (!report) return active.isLoading ? [] : reportRowsFixture;
    return report.rows as ReadonlyArray<Record<string, unknown>>;
  }, [kind, revenue.data, active.data, active.isLoading]);

  const columns = useMemo(() => tableColumns(rows), [rows]);

  const changeKind = (next: ReportKind) => {
    setKind(next);
    setExportInfo(null);
    setDownloadUrl(null);
    setExportError(null);
  };

  const createExport = async () => {
    setExportBusy(true);
    setExportError(null);
    setDownloadUrl(null);
    try {
      const info = await adminService.createReportExport({ reportKind: exportKindOf[kind] });
      setExportInfo(info);
      if (typeof info.downloadUrl === "string") setDownloadUrl(info.downloadUrl);
    } catch (err) {
      setExportError(err instanceof Error && err.message ? err.message : "Không tạo được file xuất.");
    } finally {
      setExportBusy(false);
    }
  };

  const fetchDownloadUrl = async () => {
    if (!exportInfo) return;
    setExportError(null);
    try {
      const res = await adminService.reportExportDownloadUrl(exportInfo.id);
      setDownloadUrl(res.url);
    } catch (err) {
      setExportError(err instanceof Error && err.message ? err.message : "Chưa lấy được link tải.");
    }
  };

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          {kinds.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={kind === value ? "outline" : "ghost"}
              className={kind === value ? "rounded-lg border-admin-accent text-admin-accent" : "rounded-lg"}
              onPress={() => changeKind(value)}
            >
              {reportKindLabels[value]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exportInfo ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
              Xuất: {(exportStatus.data?.status as string | undefined) ?? exportInfo.status}
              <button type="button" className="underline" onClick={() => void exportStatus.mutate()}>làm mới</button>
            </span>
          ) : null}
          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="min-h-9 rounded-lg border border-admin-accent px-3 py-1.5 text-xs font-semibold text-admin-accent"
            >
              Tải file
            </a>
          ) : exportInfo && !downloadUrl ? (
            <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => void fetchDownloadUrl()}>
              Lấy link tải
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="primary"
            className="rounded-lg"
            isDisabled={exportBusy}
            onPress={() => void createExport()}
          >
            {exportBusy ? "Đang tạo…" : "Tạo file xuất"}
          </Button>
        </div>
      </div>

      {exportError ? <p className="mb-3 text-xs text-admin-danger" role="alert">{exportError}</p> : null}
      {active.error ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được báo cáo — hiển thị dữ liệu mẫu.</p>
      ) : active.isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">Đang tải báo cáo…</p>
      ) : null}

      {kind === "revenue" && cards.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.key} className="gap-1 rounded-lg border-admin-border bg-admin-surface p-4 shadow-none">
              <span className="text-xs font-semibold uppercase tracking-wide text-admin-muted">{card.label}</span>
              <span className="text-xl font-bold text-admin-ink">{card.display}</span>
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3">{labelForKey(column)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(1, columns.length)} className="px-4 py-10 text-center text-sm text-admin-muted">
                    Không có dữ liệu báo cáo.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={index} className="border-b border-admin-border last:border-0">
                    {columns.map((column) => (
                      <td key={column} className="px-4 py-3 text-admin-ink">
                        {formatReportValue(column, row[column])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
      </Card>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-reports" } as const;
