// Pure adapters for the admin reports screen.
//
// Contract verified against the running backend (https://apiyabai.tedo.vn —
// `GET /docs-json` lists all seven operations) and the handlers that serve them:
//
//   GET  /admin/reports/{revenue-summary,branches,customers,staff-performance}
//        Query is `from` + `to` as YYYY-MM-DD — NOT a `period` string. `to` is
//        EXCLUSIVE, must be strictly after `from`, and the window may not span
//        more than 366 days or the backend answers 422 REPORT_RANGE_TOO_LARGE.
//        Every response boxes its metrics as `{ value: number | null }`, and the
//        customers report answers with `segments` and no `rows` at all.
//
//   POST /admin/report-exports -> 202 { exportId, status: "QUEUED", expiresAt }
//        Body is { reportType, format, locale, filters: { from, to } }.
//   GET  /admin/report-exports/{exportId} -> { status, errorCode, ... }
//        A worker moves QUEUED -> READY | FAILED, so the caller has to poll.
//   POST /admin/report-exports/{exportId}/download-url -> { signedUrl, expiresAt }
//        409 REPORT_EXPORT_NOT_READY until the status reaches READY.

import { formatNumber, formatVnd } from "@/lib/admin-format";
import type { AdminReportExportType } from "@/service";

export const MISSING = "—";

/**
 * The structural minimum every report answer shares. Deliberately not
 * `AdminReport`: `RevenueReport` is served by a different backend controller and
 * is a plain interface, so it is not assignable to a type carrying an index
 * signature. Reading both through this shape lets one renderer cover all four
 * tabs without a cast.
 */
export type ReportView = {
  readonly generatedAt?: string;
  readonly from?: string;
  readonly toExclusive?: string;
  readonly metrics?: Readonly<Record<string, { readonly value: number | null }>>;
  readonly segments?: Readonly<Record<string, number | null>>;
  readonly rows?: ReadonlyArray<Record<string, unknown>>;
};

export type ReportTabId = "revenue" | "branches" | "customers" | "staff";

export type ReportTab = {
  readonly id: ReportTabId;
  readonly label: string;
  readonly exportType: AdminReportExportType;
};

export const reportTabs: ReadonlyArray<ReportTab> = [
  { id: "revenue", label: "Doanh thu", exportType: "REVENUE_SUMMARY" },
  { id: "branches", label: "Chi nhánh", exportType: "BRANCHES" },
  { id: "customers", label: "Khách hàng", exportType: "CUSTOMERS" },
  { id: "staff", label: "Hiệu suất nhân viên", exportType: "STAFF_PERFORMANCE" },
];

export function isReportTabId(value: string): value is ReportTabId {
  return reportTabs.some((tab) => tab.id === value);
}

// -- Date range ------------------------------------------------------------------

export type ReportRange = { readonly from: string; readonly to: string };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local calendar date as YYYY-MM-DD — `toISOString` would shift by the UTC offset. */
export function toLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function currentMonth(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

/**
 * Turns a YYYY-MM month into the half-open range the backend wants: the first of
 * the month through the first of the next month, which is excluded.
 */
export function monthToRange(month: string): ReportRange {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const index = Number(monthText);
  const nextIndex = index === 12 ? 1 : index + 1;
  const nextYear = index === 12 ? year + 1 : year;
  return { from: `${year}-${pad(index)}-01`, to: `${nextYear}-${pad(nextIndex)}-01` };
}

/** The last `count` months ending with the month containing `now`, newest first. */
export function recentMonths(now: Date, count: number): ReadonlyArray<string> {
  const months: Array<string> = [];
  for (let offset = 0; offset < count; offset += 1) {
    months.push(currentMonth(new Date(now.getFullYear(), now.getMonth() - offset, 1)));
  }
  return months;
}

export function monthLabel(month: string): string {
  const [year, index] = month.split("-");
  return `Tháng ${index}/${year}`;
}

const MAXIMUM_RANGE_DAYS = 366;

/**
 * Mirrors the backend's own guard so an impossible range is refused here with a
 * Vietnamese sentence instead of bouncing off the API as a raw 422.
 */
export function rangeProblem(range: ReportRange): string | null {
  const from = new Date(range.from);
  const to = new Date(range.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ.";
  }
  if (to <= from) {
    return "Ngày kết thúc phải sau ngày bắt đầu.";
  }
  if (to.getTime() - from.getTime() > MAXIMUM_RANGE_DAYS * 86_400_000) {
    return "Khoảng báo cáo tối đa 12 tháng.";
  }
  return null;
}

export function formatDate(value: string | undefined): string {
  if (!value) return MISSING;
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return MISSING;
  return `${day}/${month}/${year}`;
}

/** `to` is exclusive on the wire; the salon reads an inclusive last day. */
export function formatRangeLabel(range: ReportRange): string {
  const lastDay = new Date(new Date(range.to).getTime() - 86_400_000);
  if (Number.isNaN(lastDay.getTime())) return MISSING;
  return `${formatDate(range.from)} – ${formatDate(toLocalDate(lastDay))}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return MISSING;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return MISSING;
  return parsed.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

// -- Metrics ---------------------------------------------------------------------

export type MetricTile = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
};

const metricLabels: Readonly<Record<string, string>> = {
  recognizedRevenueVnd: "Doanh thu ghi nhận",
  refundVnd: "Hoàn tiền",
  netRevenueVnd: "Doanh thu thuần",
  completedAppointmentCount: "Lịch hẹn hoàn tất",
  averageTicketVnd: "Giá trị trung bình mỗi lượt",
  uniqueCompletedCustomerCount: "Khách đã phục vụ",
  scheduledAppointmentCount: "Lịch hẹn đã đặt",
  cancelledAppointmentCount: "Lịch hẹn đã hủy",
};

function isMoneyKey(key: string): boolean {
  return key.endsWith("Vnd");
}

export function metricLabel(key: string): string {
  return metricLabels[key] ?? key;
}

function formatMetricValue(key: string, raw: unknown): string {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return MISSING;
  return isMoneyKey(key) ? formatVnd(raw) : formatNumber(raw);
}

/**
 * A metric whose `value` is null is genuinely unknown — no completed visit to
 * average, say — so it shows an em dash. Printing 0 there would state a fact the
 * backend never made, on a screen about money.
 */
export function toMetricTiles(report: ReportView | undefined): ReadonlyArray<MetricTile> {
  const metrics = report?.metrics;
  if (!metrics) return [];
  return Object.entries(metrics).map(([key, boxed]) => ({
    id: key,
    label: metricLabel(key),
    value: formatMetricValue(key, boxed?.value),
  }));
}

/** The customers report ships its aggregates under `segments` as bare numbers. */
export function toSegmentTiles(report: ReportView | undefined): ReadonlyArray<MetricTile> {
  const segments = report?.segments;
  if (!segments) return [];
  return Object.entries(segments).map(([key, raw]) => ({
    id: key,
    label: metricLabel(key),
    value: formatMetricValue(key, raw),
  }));
}

// -- Rows ------------------------------------------------------------------------

export type ReportColumn = {
  readonly key: string;
  readonly label: string;
  readonly isNumeric: boolean;
};

const rowLabels: Readonly<Record<string, string>> = {
  branchId: "Chi nhánh",
  branchName: "Tên chi nhánh",
  staffId: "Nhân viên",
  completedAppointmentCount: "Lịch hẹn hoàn tất",
  recognizedRevenueVnd: "Doanh thu ghi nhận",
  staffCompletedAppointmentCount: "Lịch hẹn hoàn tất",
  staffRecognizedRevenueVnd: "Doanh thu ghi nhận",
};

export function toRows(report: ReportView | undefined): ReadonlyArray<Record<string, unknown>> {
  return report?.rows ?? [];
}

/**
 * Columns are read off the rows themselves. The report endpoints each return a
 * different row shape and none of them is described in OpenAPI, so deriving the
 * keys beats hard-coding a table that silently drops a column the day the
 * backend adds one.
 */
export function toColumns(
  rows: ReadonlyArray<Record<string, unknown>>,
): ReadonlyArray<ReportColumn> {
  const keys: Array<string> = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys.map((key) => ({
    key,
    label: rowLabels[key] ?? key,
    isNumeric: rows.some((row) => typeof row[key] === "number"),
  }));
}

export function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return MISSING;
  if (typeof value === "number") return formatMetricValue(key, value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

// -- Export status ---------------------------------------------------------------

const exportErrorMessages: Readonly<Record<string, string>> = {
  REPORT_NO_DATA: "Khoảng thời gian này chưa có dữ liệu để xuất.",
  REPORT_SCOPE_FORBIDDEN: "Bạn không có quyền xuất báo cáo cho phạm vi này.",
  REPORT_FILTER_INVALID: "Bộ lọc của bản xuất không hợp lệ.",
  DISPATCH_FAILED: "Hệ thống không xử lý được bản xuất. Vui lòng thử lại.",
};

export function exportErrorMessage(errorCode: string | null | undefined): string {
  if (!errorCode) return "Tạo bản xuất thất bại.";
  return exportErrorMessages[errorCode] ?? `Tạo bản xuất thất bại (${errorCode}).`;
}

export function exportStatusLabel(status: string | undefined): string {
  if (status === "QUEUED") return "Đang xử lý…";
  if (status === "READY") return "Sẵn sàng tải về";
  if (status === "FAILED") return "Thất bại";
  return status ?? MISSING;
}

export const adminReportsNormalizeMeta = {
  world: "pure",
  domain: "admin-reports",
} as const;
