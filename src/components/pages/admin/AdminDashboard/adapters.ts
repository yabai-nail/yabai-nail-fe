// Pure derivations shared by the dashboard panels. Every helper turns a raw
// backend payload into the exact strings a panel renders, and every helper
// answers "chưa có dữ liệu" instead of inventing a number when the backend does
// not carry the field yet.

import { formatVnd } from "@/lib/admin-format";
import type { AdminDashboardKpi, RevenueReport } from "@/service";
import type { DashboardMetric, MetricIcon, MetricTone, StaffMember } from "./data";

export const MISSING = "—";

export type AmountRow = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
};

export type NotificationItem = {
  readonly id: string;
  readonly kind: "appointment" | "revenue" | "reminder";
  readonly title: string;
  readonly detail: string;
  readonly time: string;
};

function readNumber(source: Record<string, unknown>, keys: ReadonlyArray<string>): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function readString(source: Record<string, unknown>, keys: ReadonlyArray<string>): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

export function formatOptionalVnd(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? formatVnd(value) : MISSING;
}

export function formatOptionalCount(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : MISSING;
}

export function toInitials(name: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const last = words.slice(-2);
  return `${last[0][0]}${last[1][0]}`.toUpperCase();
}

// -- KPI cards -------------------------------------------------------------------

type MetricBase = {
  readonly id: string;
  readonly label: string;
  readonly unit?: string;
  readonly icon: MetricIcon;
  readonly tone: MetricTone;
};

const metricBases: ReadonlyArray<MetricBase> = [
  { id: "appointments", label: "Lịch hẹn hôm nay", unit: "lịch", icon: "calendar", tone: "accent" },
  { id: "revenue", label: "Doanh thu hôm nay", icon: "revenue", tone: "success" },
  { id: "customers", label: "Khách hôm nay", unit: "người", icon: "customers", tone: "info" },
  { id: "staff", label: "Nhân viên đang làm", unit: "người", icon: "staff", tone: "violet" },
];

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1).replace(".", ",")}%`;
}

function appointmentDetail(kpi: AdminDashboardKpi): string {
  const pending = pendingAppointmentCount(kpi);
  const tail = pending > 0 ? ` · Chờ: ${pending}` : "";
  return `Đã xác nhận: ${kpi.confirmed} · Đang phục vụ: ${kpi.inService} · Hoàn tất: ${kpi.completed}${tail}`;
}

function staffValue(kpi: AdminDashboardKpi): string {
  const working = kpi.workingStaffCount;
  const off = kpi.offStaffCount;
  if (typeof working !== "number") return MISSING;
  if (typeof off !== "number") return String(working);
  return `${working} / ${working + off}`;
}

export function buildDashboardMetrics(
  kpi: AdminDashboardKpi | undefined,
  isLoading: boolean,
  hasError: boolean,
): ReadonlyArray<DashboardMetric> {
  if (hasError) {
    return metricBases.map((base) => ({
      ...base,
      value: MISSING,
      detail: "Không tải được dữ liệu hôm nay",
    }));
  }
  if (isLoading || !kpi) {
    return metricBases.map((base) => ({ ...base, value: "…", detail: "Đang tải…" }));
  }

  const change = kpi.revenueChangePercent;
  const hasChange = typeof change === "number" && Number.isFinite(change);

  return metricBases.map((base): DashboardMetric => {
    switch (base.id) {
      case "appointments":
        return { ...base, value: String(kpi.total), detail: appointmentDetail(kpi) };
      case "revenue":
        return {
          ...base,
          value: formatOptionalVnd(kpi.revenueVnd),
          detail:
            typeof kpi.previousRevenueVnd === "number"
              ? `Hôm qua: ${formatVnd(kpi.previousRevenueVnd)}`
              : "Chưa có số liệu hôm qua",
          trend: hasChange ? formatPercent(change) : undefined,
          trendDirection: hasChange ? (change < 0 ? "down" : "up") : undefined,
        };
      case "customers":
        return {
          ...base,
          value: formatOptionalCount(kpi.customerCount),
          detail:
            typeof kpi.newCustomerCount === "number"
              ? `Khách mới: ${kpi.newCustomerCount}`
              : "Chưa có dữ liệu khách mới",
        };
      default:
        return {
          ...base,
          value: staffValue(kpi),
          detail:
            typeof kpi.offStaffCount === "number"
              ? kpi.offStaffCount > 0
                ? `${kpi.offStaffCount} người nghỉ`
                : "Không có ai nghỉ"
              : "Chưa có dữ liệu ca làm",
        };
    }
  });
}

// -- Revenue panel ---------------------------------------------------------------

export function buildTodayRevenueRows(
  kpi: AdminDashboardKpi | undefined,
): ReadonlyArray<AmountRow> {
  return [
    { id: "gross", label: "Tổng doanh thu", value: formatOptionalVnd(kpi?.revenueVnd) },
    { id: "cost", label: "Tổng chi phí (vật tư, khác)", value: formatOptionalVnd(kpi?.expensesVnd) },
    { id: "commission", label: "Tổng hoa hồng nhân viên", value: formatOptionalVnd(kpi?.commissionVnd) },
  ];
}

function readMetric(report: RevenueReport | undefined, key: string): number | null {
  const metric = report?.metrics?.[key];
  const value = metric?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function buildRangeRevenueRows(
  report: RevenueReport | undefined,
): ReadonlyArray<AmountRow> {
  return [
    { id: "gross", label: "Doanh thu ghi nhận", value: formatOptionalVnd(readMetric(report, "recognizedRevenueVnd")) },
    { id: "refund", label: "Hoàn tiền", value: formatOptionalVnd(readMetric(report, "refundVnd")) },
    { id: "orders", label: "Lượt hoàn tất", value: formatOptionalCount(readMetric(report, "completedAppointmentCount")) },
  ];
}

const paymentMethodLabels: Readonly<Record<string, string>> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  transfer: "Chuyển khoản",
  card: "Thẻ",
  paypay: "PayPay",
  other: "Khác",
};

export function buildPaymentMethodRows(
  entries: ReadonlyArray<Record<string, unknown>> | undefined,
): ReadonlyArray<AmountRow> {
  if (!entries) return [];
  return entries.map((entry, index) => {
    const method = readString(entry, ["method", "paymentMethod", "type", "code"]);
    const label = readString(entry, ["label", "displayName"]);
    return {
      id: method ?? `method-${index}`,
      label: label ?? (method ? paymentMethodLabels[method.toLowerCase()] ?? method : "Không rõ"),
      value: formatOptionalVnd(readNumber(entry, ["amountVnd", "totalVnd", "amount", "valueVnd"])),
    };
  });
}

// -- Staff panel -----------------------------------------------------------------

export function buildStaffCards(
  rows: ReadonlyArray<Record<string, unknown>> | undefined,
): ReadonlyArray<StaffMember> {
  if (!rows) return [];
  return rows.map((row, index) => {
    const staff = (typeof row.staff === "object" && row.staff !== null
      ? (row.staff as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const id = readString(staff, ["id"]) ?? readString(row, ["staffId", "id"]) ?? `staff-${index}`;
    const name = readString(staff, ["displayName", "name"]) ?? readString(row, ["displayName", "staffName"]) ?? "Chưa rõ tên";
    const status = readString(row, ["workingStatus", "status"]);

    return {
      id,
      name,
      initials: toInitials(name),
      status: status?.toUpperCase() === "ACTIVE" ? "Đang làm" : "Nghỉ",
      revenue: formatOptionalVnd(readNumber(row, ["revenueVnd", "revenue"])),
      payout: formatOptionalVnd(readNumber(row, ["commissionAmountVnd", "commissionVnd", "commission"])),
    };
  });
}

// -- Monthly summary -------------------------------------------------------------

export function buildMonthlyRows(
  report: RevenueReport | undefined,
  commissionVnd: number | null,
): ReadonlyArray<AmountRow> {
  return [
    { id: "revenue", label: "Doanh thu ghi nhận", value: formatOptionalVnd(readMetric(report, "recognizedRevenueVnd")) },
    { id: "refund", label: "Hoàn tiền", value: formatOptionalVnd(readMetric(report, "refundVnd")) },
    { id: "commission", label: "Hoa hồng nhân viên", value: formatOptionalVnd(commissionVnd) },
  ];
}

export function buildMonthlyNet(
  report: RevenueReport | undefined,
  commissionVnd: number | null,
): string {
  const net = readMetric(report, "netRevenueVnd");
  if (net === null || commissionVnd === null) return MISSING;
  return formatVnd(net - commissionVnd);
}

// -- Activity feed ---------------------------------------------------------------
// `GET /api/v1/me/notifications` is not usable from the admin shell: the axios
// interceptor sends the customer bearer for every non-`/admin/` path and that
// slot is never filled by an admin login. The feed is therefore derived from the
// branch dashboard payload, which is admin-scoped and already fetched.

export function formatClock(iso: string, timeZone?: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return MISSING;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(at);
}

export function pendingAppointmentCount(kpi: AdminDashboardKpi): number {
  return Math.max(0, kpi.total - kpi.confirmed - kpi.inService - kpi.completed);
}

export type ActivitySource = {
  readonly kpi: AdminDashboardKpi;
  readonly alerts: ReadonlyArray<{ readonly id: string; readonly startsAt: string; readonly status: string }>;
  readonly branchTimeZone?: string;
};

export function buildActivityItems(
  data: ActivitySource | undefined,
): ReadonlyArray<NotificationItem> {
  if (!data) return [];
  const items: NotificationItem[] = [];

  const pending = pendingAppointmentCount(data.kpi);
  if (pending > 0) {
    items.push({
      id: "pending-appointments",
      kind: "appointment",
      title: `Có ${pending} lịch hẹn chờ xác nhận`,
      detail: "Vui lòng xác nhận",
      time: "Hôm nay",
    });
  }

  for (const alert of data.alerts) {
    items.push({
      id: `alert-${alert.id}`,
      kind: "reminder",
      title: "Lịch hẹn cần xử lý",
      detail: alert.status,
      time: formatClock(alert.startsAt, data.branchTimeZone),
    });
  }

  if (typeof data.kpi.previousRevenueVnd === "number") {
    items.push({
      id: "previous-revenue",
      kind: "revenue",
      title: "Doanh thu hôm qua",
      detail: formatVnd(data.kpi.previousRevenueVnd),
      time: "Hôm qua",
    });
  }

  return items;
}

export function currentMonthPeriod(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function monthRange(period: string): { readonly from: string; readonly to: string } {
  const [yearText, monthText] = period.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return {
    from: `${period}-01`,
    to: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}

export type RevenueRangePreset = "today" | "week" | "month";

export const revenueRangeLabels: Readonly<Record<RevenueRangePreset, string>> = {
  today: "Hôm nay",
  week: "Tuần này",
  month: "Tháng này",
};

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// `to` is exclusive, matching the backend's `toExclusive` reporting window.
export function revenueRange(
  preset: RevenueRangePreset,
  today: Date,
): { readonly from: string; readonly to: string } {
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (preset === "month") {
    return { from: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)), to: toIsoDate(tomorrow) };
  }
  if (preset === "week") {
    // Vietnamese weeks start on Monday; getDay() returns 0 for Sunday.
    const offset = (today.getDay() + 6) % 7;
    return {
      from: toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)),
      to: toIsoDate(tomorrow),
    };
  }
  return { from: toIsoDate(today), to: toIsoDate(tomorrow) };
}

export const adminDashboardAdaptersMeta = { world: "pure", domain: "admin-dashboard" } as const;
