// Pure derivations shared by the dashboard panels. Every helper turns a raw
// backend payload into the exact strings a panel renders, and every helper
// answers "chưa có dữ liệu" instead of inventing a number when the backend does
// not carry the field yet.

import { formatMoney } from "@/lib/admin-format";
import type { Translator } from "@/i18n/config";
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

export function formatOptionalMoney(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? formatMoney(value) : MISSING;
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
  /** Catalogue keys under admin.dashboard, resolved by the caller's translator. */
  readonly labelKey: string;
  readonly unitKey?: string;
  readonly icon: MetricIcon;
  readonly tone: MetricTone;
};

const metricBases: ReadonlyArray<MetricBase> = [
  { id: "appointments", labelKey: "metrics.appointments", unitKey: "metrics.appointmentsUnit", icon: "calendar", tone: "accent" },
  { id: "revenue", labelKey: "metrics.revenue", icon: "revenue", tone: "success" },
  { id: "customers", labelKey: "metrics.customers", unitKey: "metrics.customersUnit", icon: "customers", tone: "info" },
  { id: "staff", labelKey: "metrics.staff", unitKey: "metrics.staffUnit", icon: "staff", tone: "violet" },
];

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1).replace(".", ",")}%`;
}

function appointmentDetail(kpi: AdminDashboardKpi, t: Translator): string {
  const pending = pendingAppointmentCount(kpi);
  const tail = pending > 0 ? t("breakdown.pendingTail", { count: pending }) : "";
  return t("breakdown.line", { confirmed: kpi.confirmed, inService: kpi.inService, completed: kpi.completed, tail });
}

function staffValue(kpi: AdminDashboardKpi): string {
  const working = kpi.workingStaffCount;
  const off = kpi.offStaffCount;
  if (typeof working !== "number") return MISSING;
  if (typeof off !== "number") return String(working);
  return `${working} / ${working + off}`;
}

/** Resolves a metric's catalogue keys into the words a card renders. */
function resolveBase(base: MetricBase, t: Translator): Omit<DashboardMetric, "value" | "detail"> {
  const { labelKey, unitKey, ...rest } = base;
  return { ...rest, label: t(labelKey), ...(unitKey ? { unit: t(unitKey) } : {}) };
}

export function buildDashboardMetrics(
  kpi: AdminDashboardKpi | undefined,
  isLoading: boolean,
  hasError: boolean,
  t: Translator,
): ReadonlyArray<DashboardMetric> {
  if (hasError) {
    return metricBases.map((base) => ({
      ...resolveBase(base, t),
      value: MISSING,
      detail: t("loadFailed"),
    }));
  }
  if (isLoading || !kpi) {
    return metricBases.map((base) => ({ ...resolveBase(base, t), value: "…", detail: t("loadingDetail") }));
  }

  const change = kpi.revenueChangePercent;
  const hasChange = typeof change === "number" && Number.isFinite(change);

  return metricBases.map((base): DashboardMetric => {
    switch (base.id) {
      case "appointments":
        return { ...resolveBase(base, t), value: String(kpi.total), detail: appointmentDetail(kpi, t) };
      case "revenue":
        return {
          ...resolveBase(base, t),
          value: formatOptionalMoney(kpi.revenue),
          detail:
            typeof kpi.previousRevenue === "number"
              ? t("yesterdayRevenue", { amount: formatMoney(kpi.previousRevenue) })
              : t("noYesterday"),
          trend: hasChange ? formatPercent(change) : undefined,
          trendDirection: hasChange ? (change < 0 ? "down" : "up") : undefined,
        };
      case "customers":
        return {
          ...resolveBase(base, t),
          value: formatOptionalCount(kpi.customerCount),
          detail:
            typeof kpi.newCustomerCount === "number"
              ? t("newCustomers", { count: kpi.newCustomerCount })
              : t("noNewCustomers"),
        };
      default:
        return {
          ...resolveBase(base, t),
          value: staffValue(kpi),
          detail:
            typeof kpi.offStaffCount === "number"
              ? kpi.offStaffCount > 0
                ? t("offStaff", { count: kpi.offStaffCount })
                : t("noneOff")
              : t("noShiftData"),
        };
    }
  });
}

// -- Revenue panel ---------------------------------------------------------------

export function buildTodayRevenueRows(
  kpi: AdminDashboardKpi | undefined,
  t: Translator,
): ReadonlyArray<AmountRow> {
  return [
    { id: "gross", label: t("summary.gross"), value: formatOptionalMoney(kpi?.revenue) },
    { id: "cost", label: t("summary.cost"), value: formatOptionalMoney(kpi?.expenses) },
    { id: "commission", label: t("summary.commission"), value: formatOptionalMoney(kpi?.commission) },
  ];
}

function readMetric(report: RevenueReport | undefined, key: string): number | null {
  const metric = report?.metrics?.[key];
  const value = metric?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function buildRangeRevenueRows(
  report: RevenueReport | undefined,
  t: Translator,
): ReadonlyArray<AmountRow> {
  return [
    { id: "gross", label: t("summary.recognized"), value: formatOptionalMoney(readMetric(report, "recognizedRevenue")) },
    { id: "refund", label: t("summary.refund"), value: formatOptionalMoney(readMetric(report, "refundTotal")) },
    { id: "orders", label: t("summary.completed"), value: formatOptionalCount(readMetric(report, "completedAppointmentCount")) },
  ];
}

// -- Revenue trend (chart) -------------------------------------------------------

export type RevenueTrendPoint = {
  readonly date: string;
  /** Short "d/M" tick label derived from `date`; falls back to the raw date. */
  readonly label: string;
  readonly revenue: number;
};

/** "2026-08-22" -> "22/8". Anything that is not an ISO date is passed through. */
function shortDayLabel(date: string): string {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const [, month, day] = parts;
  const m = Number(month);
  const d = Number(day);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return date;
  return `${d}/${m}`;
}

/**
 * Turns the revenue report's loosely-typed daily rows into chart points. Rows
 * missing a numeric revenue or a date are dropped rather than plotted as zero,
 * so a gap in the data reads as a gap and not as a real dip to nothing.
 */
export function buildRevenueTrend(
  rows: ReadonlyArray<Record<string, unknown>> | undefined,
): ReadonlyArray<RevenueTrendPoint> {
  if (!rows) return [];
  return rows.flatMap((row) => {
    const revenue = readNumber(row, ["revenue", "grossRevenue", "amount", "total"]);
    const date = readString(row, ["date", "day", "period"]);
    if (revenue === null || date === null) return [];
    return [{ date, label: shortDayLabel(date), revenue }];
  });
}

// -- Payment methods (chart) -----------------------------------------------------

export type PaymentMethodSlice = {
  readonly id: string;
  readonly label: string;
  readonly value: number;
};

/**
 * Same source as buildPaymentMethodRows, but keeps the amount as a number for a
 * chart and drops entries with no positive value — a zero slice is invisible on
 * a donut and only clutters the legend.
 */
export function buildPaymentMethodSlices(
  entries: ReadonlyArray<Record<string, unknown>> | undefined,
  t: Translator,
  tMethod: Translator,
): ReadonlyArray<PaymentMethodSlice> {
  if (!entries) return [];
  return entries.flatMap((entry, index) => {
    const method = readString(entry, ["method", "paymentMethod", "type", "code"]);
    const label = readString(entry, ["label", "displayName"]);
    const value = readNumber(entry, ["amount", "total", "value"]);
    if (value === null || value <= 0) return [];
    return [
      {
        id: method ?? `method-${index}`,
        label: label ?? (method ? methodLabel(method, tMethod) : t("unknownMethod")),
        value,
      },
    ];
  });
}

/** The API has used both spellings for a bank transfer; the catalogue names it once. */
const PAYMENT_METHOD_ALIASES: Readonly<Record<string, string>> = { transfer: "bank_transfer" };

function methodLabel(method: string, tMethod: Translator): string {
  const code = PAYMENT_METHOD_ALIASES[method.toLowerCase()] ?? method.toLowerCase();
  return tMethod.has(code) ? tMethod(code) : method;
}

export function buildPaymentMethodRows(
  entries: ReadonlyArray<Record<string, unknown>> | undefined,
  t: Translator,
  tMethod: Translator,
): ReadonlyArray<AmountRow> {
  if (!entries) return [];
  return entries.map((entry, index) => {
    const method = readString(entry, ["method", "paymentMethod", "type", "code"]);
    const label = readString(entry, ["label", "displayName"]);
    return {
      id: method ?? `method-${index}`,
      label: label ?? (method ? methodLabel(method, tMethod) : t("unknownMethod")),
      value: formatOptionalMoney(readNumber(entry, ["amount", "total", "amount", "value"])),
    };
  });
}

// -- Staff panel -----------------------------------------------------------------

export function buildStaffCards(
  rows: ReadonlyArray<Record<string, unknown>> | undefined,
  t: Translator,
): ReadonlyArray<StaffMember> {
  if (!rows) return [];
  return rows.map((row, index) => {
    const staff = (typeof row.staff === "object" && row.staff !== null
      ? (row.staff as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const id = readString(staff, ["id"]) ?? readString(row, ["staffId", "id"]) ?? `staff-${index}`;
    const name = readString(staff, ["displayName", "name"]) ?? readString(row, ["displayName", "staffName"]) ?? t("unknownStaffName");
    const status = readString(row, ["workingStatus", "status"]);

    return {
      id,
      name,
      initials: toInitials(name),
      status: status?.toUpperCase() === "ACTIVE" ? "working" : "off",
      revenue: formatOptionalMoney(readNumber(row, ["revenue", "revenue"])),
      payout: formatOptionalMoney(readNumber(row, ["commissionAmount", "commission", "commission"])),
    };
  });
}

// -- Monthly summary -------------------------------------------------------------

export function buildMonthlyRows(
  report: RevenueReport | undefined,
  commission: number | null,
  t: Translator,
): ReadonlyArray<AmountRow> {
  return [
    { id: "revenue", label: t("summary.recognized"), value: formatOptionalMoney(readMetric(report, "recognizedRevenue")) },
    { id: "refund", label: t("summary.refund"), value: formatOptionalMoney(readMetric(report, "refundTotal")) },
    { id: "commission", label: t("summary.staffCommission"), value: formatOptionalMoney(commission) },
  ];
}

export function buildMonthlyNet(
  report: RevenueReport | undefined,
  commission: number | null,
): string {
  const net = readMetric(report, "netRevenue");
  if (net === null || commission === null) return MISSING;
  return formatMoney(net - commission);
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
  t: Translator,
): ReadonlyArray<NotificationItem> {
  if (!data) return [];
  const items: NotificationItem[] = [];

  const pending = pendingAppointmentCount(data.kpi);
  if (pending > 0) {
    items.push({
      id: "pending-appointments",
      kind: "appointment",
      title: t("alert.pendingTitle", { count: pending }),
      detail: t("alert.pendingDetail"),
      time: t("alert.today"),
    });
  }

  for (const alert of data.alerts) {
    items.push({
      id: `alert-${alert.id}`,
      kind: "reminder",
      title: t("alert.needsAction"),
      detail: alert.status,
      time: formatClock(alert.startsAt, data.branchTimeZone),
    });
  }

  if (typeof data.kpi.previousRevenue === "number") {
    items.push({
      id: "previous-revenue",
      kind: "revenue",
      title: t("alert.yesterdayRevenue"),
      detail: formatMoney(data.kpi.previousRevenue),
      time: t("alert.yesterday"),
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

/** Catalogue keys under admin.dashboard, not words. */
export const revenueRangeLabelKeys: Readonly<Record<RevenueRangePreset, string>> = {
  today: "range.today",
  week: "range.week",
  month: "range.month",
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
