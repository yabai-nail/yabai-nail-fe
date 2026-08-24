import { describe, expect, it } from "vitest";
import {
  averageCommissionRate,
  currentMonthPeriod,
  indexStaffPerformance,
  readStaffPerformanceRows,
} from "./admin-staff-performance";

const verifiedRow = {
  staff: { id: "staff-1", displayName: "Mai Linh" },
  workingStatus: "ACTIVE",
  revenueVnd: 2840000,
  orderCount: 4,
  commissionRate: 60,
  commissionAmountVnd: 1704000,
  version: 3,
};

describe("currentMonthPeriod", () => {
  it("formats the UTC month as YYYY-MM with a padded month", () => {
    expect(currentMonthPeriod(new Date("2026-03-09T00:00:00Z"))).toBe("2026-03");
    expect(currentMonthPeriod(new Date("2026-11-30T23:00:00Z"))).toBe("2026-11");
  });
});

describe("readStaffPerformanceRows", () => {
  it("reads the shape verified against the live backend", () => {
    expect(readStaffPerformanceRows([verifiedRow])).toEqual([
      {
        staffId: "staff-1",
        displayName: "Mai Linh",
        workingStatus: "ACTIVE",
        revenueVnd: 2840000,
        orderCount: 4,
        commissionRate: 60,
        commissionAmountVnd: 1704000,
      },
    ]);
  });

  it("accepts a flat staffId instead of a nested staff object", () => {
    const rows = readStaffPerformanceRows([{ staffId: "staff-2", staffName: "Thảo Vy" }]);
    expect(rows[0].staffId).toBe("staff-2");
    expect(rows[0].displayName).toBe("Thảo Vy");
  });

  it("reports an absent number as null rather than zero", () => {
    const rows = readStaffPerformanceRows([{ staff: { id: "staff-3" } }]);
    expect(rows[0]).toMatchObject({
      displayName: null,
      revenueVnd: null,
      orderCount: null,
      commissionRate: null,
      commissionAmountVnd: null,
    });
  });

  it("keeps a real zero distinct from a missing field", () => {
    const rows = readStaffPerformanceRows([{ staff: { id: "staff-4" }, revenueVnd: 0 }]);
    expect(rows[0].revenueVnd).toBe(0);
  });

  it("drops rows that carry no staff id", () => {
    expect(readStaffPerformanceRows([{ revenueVnd: 100 }])).toEqual([]);
  });

  it("returns an empty list while the request is still in flight", () => {
    expect(readStaffPerformanceRows(undefined)).toEqual([]);
  });
});

describe("indexStaffPerformance", () => {
  it("keys rows by staff id", () => {
    const index = indexStaffPerformance([verifiedRow]);
    expect(index.get("staff-1")?.revenueVnd).toBe(2840000);
    expect(index.get("missing")).toBeUndefined();
  });

  it("keeps the first row when the backend repeats a staff id", () => {
    const index = indexStaffPerformance([
      { staff: { id: "dup" }, revenueVnd: 1 },
      { staff: { id: "dup" }, revenueVnd: 2 },
    ]);
    expect(index.get("dup")?.revenueVnd).toBe(1);
  });
});

describe("averageCommissionRate", () => {
  it("averages only the rates the backend reported", () => {
    expect(averageCommissionRate([60, null, 40])).toBe(50);
  });

  it("rounds to a whole percent", () => {
    expect(averageCommissionRate([60, 45, 40])).toBe(48);
  });

  it("returns null when no rate is known", () => {
    expect(averageCommissionRate([null, null])).toBeNull();
    expect(averageCommissionRate([])).toBeNull();
  });
});
