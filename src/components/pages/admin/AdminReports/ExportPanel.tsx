"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useState } from "react";

import { adminService, isReportExportSettled, useAdminReportExport } from "@/service";
import type { AdminReportExportFormat, AdminReportExportType } from "@/service";
import {
  exportErrorMessage,
  exportStatusLabel,
  formatDateTime,
  type ReportRange,
} from "./normalize";

const POLL_INTERVAL_MS = 3_000;
// The worker normally finishes in seconds. Capping the attempts means a job that
// never leaves QUEUED stops polling after ~2 minutes and hands the salon a
// manual re-check, instead of a tab that requests forever.
const MAXIMUM_POLLS = 40;

type ExportPanelProps = {
  readonly reportType: AdminReportExportType;
  readonly reportLabel: string;
  readonly range: ReportRange;
  readonly isRangeValid: boolean;
};

export function ExportPanel({
  reportType,
  reportLabel,
  range,
  isRangeValid,
}: ExportPanelProps) {
  const [format, setFormat] = useState<AdminReportExportFormat>("CSV");
  const [exportId, setExportId] = useState<string | null>(null);
  const [polls, setPolls] = useState(0);
  const [isCreating, setCreating] = useState(false);
  const [isResolvingUrl, setResolvingUrl] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Kept so a blocked popup still leaves the salon a link they can click.
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const hasGivenUpPolling = polls >= MAXIMUM_POLLS;

  const {
    data: exportRecord,
    error: pollError,
    mutate: refreshExport,
  } = useAdminReportExport(exportId, {
    // SWR re-evaluates this after every response, so answering 0 the moment the
    // backend settles on READY or FAILED is what actually stops the poll.
    refreshInterval: (latest) =>
      isReportExportSettled(latest?.status) || hasGivenUpPolling ? 0 : POLL_INTERVAL_MS,
    revalidateOnFocus: false,
    onSuccess: () => setPolls((count) => count + 1),
  });

  const status = exportRecord?.status;
  const isReady = status === "READY";
  const isFailed = status === "FAILED";
  const isUnsettled = exportId !== null && !isReady && !isFailed;
  // Once the poll errors out or gives up, the run stops counting as pending so
  // the create button comes back — otherwise a failed status check would leave
  // the salon staring at a disabled button with no way to start over.
  const isPending = isUnsettled && !pollError && !hasGivenUpPolling;

  async function createExport() {
    setCreating(true);
    setActionError(null);
    setDownloadUrl(null);
    setExportId(null);
    setPolls(0);
    try {
      // No `branchIds`: the reports above are scoped by the caller's own role,
      // so pinning the export to one branch would hand back a file that does
      // not match the numbers on screen.
      const created = await adminService.createReportExport({
        reportType,
        format,
        locale: "vi",
        filters: { from: range.from, to: range.to },
      });
      setExportId(created.exportId);
    } catch (thrown) {
      setActionError(
        thrown instanceof Error ? thrown.message : "Không tạo được bản xuất báo cáo.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function openDownload() {
    if (!exportId) return;
    setResolvingUrl(true);
    setActionError(null);
    try {
      const { signedUrl } = await adminService.reportExportDownloadUrl(exportId);
      setDownloadUrl(signedUrl);
      const opened = window.open(signedUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        setActionError(
          "Trình duyệt đã chặn cửa sổ mới. Dùng liên kết tải về bên dưới.",
        );
      }
    } catch (thrown) {
      setActionError(
        thrown instanceof Error ? thrown.message : "Không lấy được liên kết tải về.",
      );
    } finally {
      setResolvingUrl(false);
    }
  }

  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">Xuất file</h2>
        <p className="mt-1 text-xs text-admin-muted">
          Xuất báo cáo {reportLabel.toLowerCase()} theo khoảng thời gian đang chọn.
        </p>
      </Card.Header>

      <Card.Content className="space-y-3 px-4 pb-5 pt-4 sm:px-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-admin-ink">
            <span>Định dạng</span>
            <select
              className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm font-normal text-admin-ink outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as AdminReportExportFormat)
              }
            >
              <option value="CSV">CSV</option>
              <option value="XLSX">Excel (XLSX)</option>
            </select>
          </label>

          <Button
            variant="primary"
            className="rounded-lg"
            isDisabled={!isRangeValid || isCreating || isPending}
            onPress={() => void createExport()}
          >
            {isCreating ? "Đang tạo…" : isPending ? "Đang xử lý…" : "Tạo bản xuất"}
          </Button>

          {isReady ? (
            <Button
              variant="outline"
              className="rounded-lg border-admin-border"
              isDisabled={isResolvingUrl}
              onPress={() => void openDownload()}
            >
              <ArrowDownTrayIcon className="size-4" />
              {isResolvingUrl ? "Đang lấy liên kết…" : "Tải về"}
            </Button>
          ) : null}
        </div>

        {!isRangeValid ? (
          <p className="text-xs text-admin-muted">
            Chọn một khoảng thời gian hợp lệ trước khi xuất file.
          </p>
        ) : null}

        {exportId ? (
          <div className="rounded-lg border border-admin-border bg-admin-canvas px-3 py-3 text-xs">
            <p className="text-admin-ink">
              Trạng thái bản xuất:{" "}
              <span className="font-semibold">{exportStatusLabel(status)}</span>
            </p>
            {exportRecord?.completedAt ? (
              <p className="mt-1 text-admin-muted">
                Hoàn tất lúc {formatDateTime(exportRecord.completedAt)}
              </p>
            ) : null}
            {isReady && exportRecord?.expiresAt ? (
              <p className="mt-1 text-admin-muted">
                Liên kết hết hạn {formatDateTime(exportRecord.expiresAt)}
              </p>
            ) : null}
            {isPending ? (
              <p className="mt-1 text-admin-muted">
                Hệ thống đang dựng file, trang sẽ tự cập nhật.
              </p>
            ) : null}
            {isUnsettled && hasGivenUpPolling ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-admin-muted">
                  Bản xuất xử lý lâu hơn dự kiến nên đã dừng tự kiểm tra.
                </span>
                <Button
                  variant="outline"
                  className="rounded-lg border-admin-border"
                  onPress={() => {
                    setPolls(0);
                    void refreshExport();
                  }}
                >
                  Kiểm tra lại
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {isFailed ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {exportErrorMessage(exportRecord?.errorCode)}
          </p>
        ) : null}

        {pollError ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            Không kiểm tra được trạng thái bản xuất: {pollError.message}
          </p>
        ) : null}

        {actionError ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {actionError}
          </p>
        ) : null}

        {downloadUrl ? (
          <p className="text-xs">
            <a
              className="font-semibold text-admin-accent underline"
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Liên kết tải về
            </a>
          </p>
        ) : null}
      </Card.Content>
    </Card>
  );
}
