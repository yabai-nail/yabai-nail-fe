// The dashboard panels are thin: each one picks a hook, then hands the payload
// to a pure adapter. These tests lock the adapters — especially the "backend
// does not carry this field" branches, which are the whole reason the fixtures
// were removed.

import { describe, expect, it } from "vitest";

import {
  MISSING,
  buildActivityItems,
  buildDashboardMetrics,
  buildMonthlyNet,
  buildMonthlyRows,
  buildPaymentMethodRows,
  buildRangeRevenueRows,
  buildStaffCards,
  buildTodayRevenueRows,
  currentMonthPeriod,
  formatClock,
  monthRange,
  pendingAppointmentCount,
  revenueRange,
  toInitials,
} from "./adapters";
import type { AdminDashboardKpi, RevenueReport } from "@/service";

const fullKpi: AdminDashboardKpi = {
  total: 12,
  confirmed: 8,
  inService: 1,
  completed: 1,
  revenueVnd: 7_860_000,
  previousRevenueVnd: 6_630_000,
  revenueChangePercent: 18.55,
  customerCount: 10,
  newCustomerCount: 2,
  workingStaffCount: 3,
  offStaffCount: 1,
  expensesVnd: 1_230_000,
  commissionVnd: 3_548_000,
  salonShareVnd: 3_082_000,
};

// The four counters are all an older deploy is guaranteed to return.
const bareKpi: AdminDashboardKpi = { total: 4, confirmed: 2, inService: 1, completed: 1 };

function amountOf(rows: ReadonlyArray<{ id: string; value: string }>, id: string): string {
  const row = rows.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`missing row: ${id}`);
  return row.value;
}

describe("buildDashboardMetrics", () => {
  it("puts every card in a loading state while the request is in flight", () => {
    const metrics = buildDashboardMetrics(undefined, true, false);
    expect(metrics).toHaveLength(4);
    expect(metrics.every((metric) => metric.value === "…")).toBe(true);
    expect(metrics.every((metric) => metric.detail === "Đang tải…")).toBe(true);
  });

  it("puts every card in an error state when the request fails", () => {
    const metrics = buildDashboardMetrics(fullKpi, false, true);
    expect(metrics.every((metric) => metric.value === MISSING)).toBe(true);
    expect(metrics[0].detail).toContain("Không tải được");
  });

  it("renders the four live KPI cards from the branch dashboard payload", () => {
    const [appointments, revenue, customers, staff] = buildDashboardMetrics(fullKpi, false, false);

    expect(appointments.value).toBe("12");
    expect(appointments.detail).toBe("Đã xác nhận: 8 · Đang phục vụ: 1 · Hoàn tất: 1 · Chờ: 2");
    expect(revenue.value).toContain("7.860.000");
    expect(revenue.detail).toContain("Hôm qua");
    expect(revenue.trend).toBe("18,6%");
    expect(revenue.trendDirection).toBe("up");
    expect(customers.value).toBe("10");
    expect(customers.detail).toBe("Khách mới: 2");
    expect(staff.value).toBe("3 / 4");
    expect(staff.detail).toBe("1 người nghỉ");
  });

  it("flags a revenue drop as a downward trend", () => {
    const [, revenue] = buildDashboardMetrics({ ...fullKpi, revenueChangePercent: -12.34 }, false, false);
    expect(revenue.trend).toBe("12,3%");
    expect(revenue.trendDirection).toBe("down");
  });

  it("never invents a number when the payload omits the field", () => {
    const [appointments, revenue, customers, staff] = buildDashboardMetrics(bareKpi, false, false);

    expect(appointments.value).toBe("4");
    expect(appointments.detail).toBe("Đã xác nhận: 2 · Đang phục vụ: 1 · Hoàn tất: 1");
    expect(revenue.value).toBe(MISSING);
    expect(revenue.trend).toBeUndefined();
    expect(customers.value).toBe(MISSING);
    expect(customers.detail).toBe("Chưa có dữ liệu khách mới");
    expect(staff.value).toBe(MISSING);
    expect(staff.detail).toBe("Chưa có dữ liệu ca làm");
  });
});

describe("pendingAppointmentCount", () => {
  it("never goes negative when the counters overlap", () => {
    expect(pendingAppointmentCount({ total: 2, confirmed: 2, inService: 1, completed: 1 })).toBe(0);
  });
});

describe("revenue rows", () => {
  it("reads today's breakdown from the dashboard KPI", () => {
    const rows = buildTodayRevenueRows(fullKpi);
    expect(amountOf(rows, "gross")).toContain("7.860.000");
    expect(amountOf(rows, "cost")).toContain("1.230.000");
    expect(amountOf(rows, "commission")).toContain("3.548.000");
  });

  it("falls back to a placeholder when the KPI has not arrived", () => {
    const rows = buildTodayRevenueRows(undefined);
    expect(rows.map((row) => row.value)).toEqual([MISSING, MISSING, MISSING]);
  });

  it("reads a wider range from the revenue report metrics", () => {
    const report = {
      metrics: {
        recognizedRevenueVnd: { value: 124_560_000 },
        refundVnd: { value: 0 },
        completedAppointmentCount: { value: 42 },
      },
    } as unknown as RevenueReport;

    const rows = buildRangeRevenueRows(report);
    expect(amountOf(rows, "gross")).toContain("124.560.000");
    expect(amountOf(rows, "orders")).toBe("42");
  });

  it("shows a placeholder for a report metric the backend returned as null", () => {
    const report = { metrics: { recognizedRevenueVnd: { value: null } } } as unknown as RevenueReport;
    expect(amountOf(buildRangeRevenueRows(report), "gross")).toBe(MISSING);
  });
});

describe("buildPaymentMethodRows", () => {
  it("returns nothing when the branch captured no payment today", () => {
    expect(buildPaymentMethodRows([])).toEqual([]);
    expect(buildPaymentMethodRows(undefined)).toEqual([]);
  });

  it("maps known method codes to Vietnamese labels", () => {
    const rows = buildPaymentMethodRows([
      { method: "cash", amountVnd: 4_560_000 },
      { method: "BANK_TRANSFER", totalVnd: 2_800_000 },
    ]);
    expect(rows[0].label).toBe("Tiền mặt");
    expect(rows[0].value).toContain("4.560.000");
    expect(rows[1].label).toBe("Chuyển khoản");
    expect(rows[1].value).toContain("2.800.000");
  });

  it("keeps an unknown method visible instead of dropping the money", () => {
    const rows = buildPaymentMethodRows([{ method: "momo" }]);
    expect(rows[0].label).toBe("momo");
    expect(rows[0].value).toBe(MISSING);
  });
});

describe("buildStaffCards", () => {
  it("flattens the nested staff object the report returns", () => {
    const cards = buildStaffCards([
      {
        staff: { id: "97ea397d", displayName: "Mai Linh" },
        workingStatus: "ACTIVE",
        revenueVnd: 2_680_000,
        commissionAmountVnd: 1_608_000,
      },
      {
        staff: { id: "b2", displayName: "Bảo Ngọc" },
        workingStatus: "INACTIVE",
        revenueVnd: 0,
        commissionAmountVnd: 0,
      },
    ]);

    expect(cards[0]).toMatchObject({ id: "97ea397d", name: "Mai Linh", initials: "ML", status: "Đang làm" });
    expect(cards[0].revenue).toContain("2.680.000");
    expect(cards[0].payout).toContain("1.608.000");
    expect(cards[1].status).toBe("Nghỉ");
  });

  it("survives a row without a staff object", () => {
    const cards = buildStaffCards([{ revenueVnd: 10 }]);
    expect(cards[0].id).toBe("staff-0");
    expect(cards[0].name).toBe("Chưa rõ tên");
    expect(cards[0].payout).toBe(MISSING);
  });
});

describe("toInitials", () => {
  it.each([
    ["Mai Linh", "ML"],
    ["Yuki", "YU"],
    ["Nguyễn Thu Hương", "TH"],
    ["   ", "?"],
  ])("turns %s into %s", (name, expected) => {
    expect(toInitials(name)).toBe(expected);
  });
});

describe("monthly summary", () => {
  const report = {
    metrics: {
      recognizedRevenueVnd: { value: 124_560_000 },
      refundVnd: { value: 1_000_000 },
      netRevenueVnd: { value: 123_560_000 },
    },
  } as unknown as RevenueReport;

  it("takes commission from the staff-performance KPI, not the revenue report", () => {
    const rows = buildMonthlyRows(report, 56_822_000);
    expect(amountOf(rows, "revenue")).toContain("124.560.000");
    expect(amountOf(rows, "commission")).toContain("56.822.000");
  });

  it("marks commission as missing when staff performance failed to load", () => {
    expect(amountOf(buildMonthlyRows(report, null), "commission")).toBe(MISSING);
  });

  it("derives the remainder only when both sources are present", () => {
    expect(buildMonthlyNet(report, 56_822_000)).toContain("66.738.000");
    expect(buildMonthlyNet(report, null)).toBe(MISSING);
    expect(buildMonthlyNet(undefined, 1)).toBe(MISSING);
  });
});

describe("buildActivityItems", () => {
  it("returns nothing before the dashboard resolves", () => {
    expect(buildActivityItems(undefined)).toEqual([]);
  });

  it("derives pending-confirmation, alert and yesterday-revenue entries", () => {
    const items = buildActivityItems({
      kpi: fullKpi,
      alerts: [{ id: "a1", startsAt: "2026-08-24T03:00:00.000Z", status: "PENDING" }],
      branchTimeZone: "Asia/Ho_Chi_Minh",
    });

    expect(items.map((item) => item.id)).toEqual([
      "pending-appointments",
      "alert-a1",
      "previous-revenue",
    ]);
    expect(items[0].title).toBe("Có 2 lịch hẹn chờ xác nhận");
    expect(items[1].time).toBe("10:00");
    expect(items[2].detail).toContain("6.630.000");
  });

  it("emits an empty feed when nothing needs attention", () => {
    expect(buildActivityItems({ kpi: bareKpi, alerts: [] })).toEqual([]);
  });
});

describe("formatClock", () => {
  it("renders the branch-local time regardless of where the browser runs", () => {
    expect(formatClock("2026-08-24T11:30:00.000Z", "Asia/Ho_Chi_Minh")).toBe("18:30");
  });

  it("returns a placeholder for an unparseable timestamp", () => {
    expect(formatClock("not-a-date")).toBe(MISSING);
  });
});

describe("date ranges", () => {
  it("builds an exclusive end bound for each preset", () => {
    // 2026-08-19 is a Wednesday, so the week starts on Monday 2026-08-17.
    const today = new Date(2026, 7, 19);
    expect(revenueRange("today", today)).toEqual({ from: "2026-08-19", to: "2026-08-20" });
    expect(revenueRange("week", today)).toEqual({ from: "2026-08-17", to: "2026-08-20" });
    expect(revenueRange("month", today)).toEqual({ from: "2026-08-01", to: "2026-08-20" });
  });

  it("treats Sunday as the last day of the week", () => {
    // 2026-08-23 is a Sunday.
    expect(revenueRange("week", new Date(2026, 7, 23)).from).toBe("2026-08-17");
  });

  it("rolls the month range over the year boundary", () => {
    expect(currentMonthPeriod(new Date(2026, 11, 31))).toBe("2026-12");
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
    expect(monthRange("2026-08")).toEqual({ from: "2026-08-01", to: "2026-09-01" });
  });
});
