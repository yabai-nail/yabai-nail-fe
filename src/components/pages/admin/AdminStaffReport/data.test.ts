import { describe, expect, it } from "vitest";
import type { AdminSalesReport } from "@/service";
import { groupByDay } from "./data";

function report(id: string, reportDate: string, staffAmount: number): AdminSalesReport {
  return {
    id, branchId: "b", staffId: "s", reportedByAccountId: null, reportDate, servedAt: null, platform: "APP",
    coursePrice: 0, accessoryAmount: 0, grossAmount: 0, platformFee: 0, staffFeeShare: 0, salonFeeShare: 0, staffRatePercent: 50,
    staffAmount, salonAmount: 0, paymentMethod: "CASH", note: "", status: "PENDING", rejectionReason: null, decidedBy: null, decidedAt: null,
    appointmentId: null, paymentId: null, payrollPeriodId: null, locked: false, version: 1, createdAt: null, updatedAt: null,
  };
}

describe("groupByDay", () => {
  it("groups by day, newest day first, keeping the listed order within a day, with the day's share", () => {
    const groups = groupByDay([report("a", "2026-09-17", 4620), report("b", "2026-09-18", 5000), report("c", "2026-09-17", 3740)]);
    expect(groups.map((group) => group.date)).toEqual(["2026-09-18", "2026-09-17"]);
    expect(groups[1].rows.map((row) => row.id)).toEqual(["a", "c"]);
    expect(groups[1].mine).toBe(8360);
  });

  it("is empty for no reports", () => {
    expect(groupByDay([])).toEqual([]);
  });
});
