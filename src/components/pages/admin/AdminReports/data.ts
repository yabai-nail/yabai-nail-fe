import { formatMoney } from "@/lib/admin-format";
import type { Translator } from "@/i18n/config";
import type { RevenueReport } from "@/service";

export type ReportKind = "revenue" | "branches" | "customers" | "staff";

/** Backend reportType enum for POST /admin/report-exports. */
export const exportKindOf = {
  revenue: "REVENUE_SUMMARY",
  branches: "BRANCHES",
  customers: "CUSTOMERS",
  staff: "STAFF_PERFORMANCE",
} as const;

export function exportStatusLabel(status: string | undefined, t: Translator): string {
  const code = String(status ?? "QUEUED").toUpperCase();
  return t.has(`exportStatus.${code}`) ? t(`exportStatus.${code}`) : t("exportStatus.unknown");
}

export type ReportLookups = {
  readonly branches?: ReadonlyMap<string, string>;
  readonly customers?: ReadonlyMap<string, string>;
  readonly services?: ReadonlyMap<string, string>;
  readonly staff?: ReadonlyMap<string, string>;
};

/** Replaces identifier columns with their human-readable counterpart. */
export function resolveReportIdentifiers(
  rows: ReadonlyArray<Record<string, unknown>>,
  lookups: ReportLookups,
  t: Translator,
): ReadonlyArray<Record<string, unknown>> {
  const identifierColumns: Record<string, readonly [string, ReadonlyMap<string, string> | undefined, string]> = {
    branchId: ["branchName", lookups.branches, t("unnamedBranch")],
    customerId: ["customerName", lookups.customers, t("unnamedCustomer")],
    serviceId: ["serviceName", lookups.services, t("unnamedService")],
    staffId: ["staffName", lookups.staff, t("unnamedStaff")],
  };

  return rows.map((row) => Object.fromEntries(Object.entries(row).flatMap(([key, value]) => {
    const resolved = identifierColumns[key];
    if (resolved) {
      const [displayKey, names, fallback] = resolved;
      return [[displayKey, names?.get(String(value)) ?? fallback]];
    }
    return key === "id" || /Ids?$/.test(key) ? [] : [[key, value]];
  })));
}

export function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

/** A column the catalogue does not name falls back to a humanised form of its key. */
export function labelForKey(key: string, t: Translator): string {
  return t.has(`columns.${key}`) ? t(`columns.${key}`) : humanizeKey(key);
}

export function formatReportValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return /revenue|amount|ticket|commission|refund|salary|price|total/i.test(key)
      ? formatMoney(value)
      : value.toLocaleString("vi-VN");
  }
  return String(value);
}

export type MetricCard = { readonly key: string; readonly label: string; readonly display: string };

export function metricCards(report: RevenueReport | undefined, t: Translator): ReadonlyArray<MetricCard> {
  if (!report) return [];
  return Object.entries(report.metrics).map(([key, metric]) => ({
    key,
    label: labelForKey(key, t),
    display: formatReportValue(key, metric.value),
  }));
}

export function tableColumns(
  rows: ReadonlyArray<Record<string, unknown>>,
): ReadonlyArray<string> {
  const seen = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) seen.add(key);
  return Array.from(seen);
}

export const revenueFixture: RevenueReport = {
  metricVersion: "1",
  currency: "JPY",
  from: "2026-08-01",
  toExclusive: "2026-08-25",
  generatedAt: "2026-08-24T00:00:00.000Z",
  metrics: {
    grossRevenue: { value: 734000 },
    netRevenue: { value: 549000 },
    appointments: { value: 142 },
    newCustomers: { value: 23 },
  },
  rows: [
    { date: "2026-08-22", revenue: 46800, appointments: 9 },
    { date: "2026-08-23", revenue: 59700, appointments: 12 },
    { date: "2026-08-24", revenue: 43400, appointments: 8 },
  ],
};

export const reportRowsFixture: ReadonlyArray<Record<string, unknown>> = [
  { name: "Yuki", revenue: 240000, orders: 51, commission: 36000 },
  { name: "Mai", revenue: 180000, orders: 38, commission: 27000 },
];
