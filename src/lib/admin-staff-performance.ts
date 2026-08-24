// Narrowing for `GET /api/v1/admin/branches/{branchId}/staff-performance`.
//
// The service layer keeps `rows` as `Record<string, unknown>` because the
// backend contract is not in OpenAPI yet (BE-GAP-010). The shape verified
// against https://apiyabai.tedo.vn is
//   { staff: { id, displayName }, workingStatus, revenueVnd, orderCount,
//     commissionRate, commissionAmountVnd, version }
// so every read here accepts the verified key first and a plausible alias
// second, and answers `null` rather than `0` when the field is absent — a
// missing number and a real zero are different facts on a money screen.

export type StaffPerformanceRow = {
  readonly staffId: string;
  readonly displayName: string | null;
  readonly workingStatus: string | null;
  readonly revenueVnd: number | null;
  readonly orderCount: number | null;
  readonly commissionRate: number | null;
  readonly commissionAmountVnd: number | null;
};

function readRecord(source: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = source[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

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

/** `YYYY-MM` for the month `now` falls in — the `period` query the read model takes. */
export function currentMonthPeriod(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function readStaffPerformanceRows(
  rows: ReadonlyArray<Record<string, unknown>> | undefined,
): ReadonlyArray<StaffPerformanceRow> {
  if (!rows) return [];
  const parsed: Array<StaffPerformanceRow> = [];
  for (const row of rows) {
    const staff = readRecord(row, "staff") ?? {};
    const staffId = readString(staff, ["id"]) ?? readString(row, ["staffId", "id"]);
    // A row we cannot attribute to a staff member is unusable for every caller
    // here, all of which join it onto the staff roster.
    if (!staffId) continue;
    parsed.push({
      staffId,
      displayName:
        readString(staff, ["displayName", "name"])
        ?? readString(row, ["displayName", "staffName"]),
      workingStatus: readString(row, ["workingStatus", "status"]),
      revenueVnd: readNumber(row, ["revenueVnd", "revenue"]),
      orderCount: readNumber(row, ["orderCount", "count"]),
      commissionRate: readNumber(row, ["commissionRate", "rate"]),
      commissionAmountVnd: readNumber(row, ["commissionAmountVnd", "commissionVnd", "commission"]),
    });
  }
  return parsed;
}

export function indexStaffPerformance(
  rows: ReadonlyArray<Record<string, unknown>> | undefined,
): ReadonlyMap<string, StaffPerformanceRow> {
  const index = new Map<string, StaffPerformanceRow>();
  for (const row of readStaffPerformanceRows(rows)) {
    // First row wins: the read model is one row per staff per period, so a
    // duplicate would be a backend fault, not a signal to overwrite.
    if (!index.has(row.staffId)) index.set(row.staffId, row);
  }
  return index;
}

/** Average of the rates the backend actually reported; `null` when it reported none. */
export function averageCommissionRate(
  rates: ReadonlyArray<number | null>,
): number | null {
  const known = rates.filter((rate): rate is number => typeof rate === "number");
  if (known.length === 0) return null;
  return Math.round(known.reduce((sum, rate) => sum + rate, 0) / known.length);
}

export const adminStaffPerformanceMeta = {
  world: "pure",
  domain: "admin-staff-performance",
} as const;
