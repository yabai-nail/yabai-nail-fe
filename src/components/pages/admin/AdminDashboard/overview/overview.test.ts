import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compactYen,
  formatBucketLabel,
  formatPeriodLabel,
  isCurrentOrFutureWindow,
  sharePercent,
  shiftOverviewAnchor,
} from "./overview-period";
import { foldPaymentMethods } from "./OverviewCharts";

const dir = join(process.cwd(), "src", "components", "pages", "admin", "AdminDashboard");
const read = (...parts: string[]) => readFileSync(join(dir, ...parts), "utf8");

describe("overview period helpers", () => {
  it("steps a week, a month and a year back and forth, across year ends", () => {
    expect(shiftOverviewAnchor("2026-09-21", "WEEK", -1)).toBe("2026-09-14");
    expect(shiftOverviewAnchor("2026-12-28", "WEEK", 1)).toBe("2027-01-04");
    expect(shiftOverviewAnchor("2026-01-01", "MONTH", -1)).toBe("2025-12-01");
    expect(shiftOverviewAnchor("2026-09-01", "MONTH", 1)).toBe("2026-10-01");
    expect(shiftOverviewAnchor("2026-01-01", "YEAR", -1)).toBe("2025-01-01");
  });

  it("blocks stepping past the window that contains today", () => {
    expect(isCurrentOrFutureWindow("2026-10-01", "2026-09-26")).toBe(true);
    expect(isCurrentOrFutureWindow("2026-09-01", "2026-09-26")).toBe(false);
  });

  it("labels windows and buckets for people, not machines", () => {
    expect(formatPeriodLabel({ period: "YEAR", from: "2026-01-01", toExclusive: "2027-01-01" }, "vi")).toBe("2026");
    expect(formatPeriodLabel({ period: "WEEK", from: "2026-09-21", toExclusive: "2026-09-28" }, "vi")).toContain("27/09/2026");
    expect(formatBucketLabel("2026-09-05", "DAY", "vi")).toBe("5/9");
    expect(formatBucketLabel("2026-03", "MONTH", "en")).toBe("Mar");
  });

  it("formats yen ticks compactly and shares safely", () => {
    expect(compactYen(46_800)).toBe("47K");
    expect(compactYen(1_200_000)).toBe("1.2M");
    expect(sharePercent(1, 4)).toBe(25);
    expect(sharePercent(1, 0)).toBe(0);
  });
});

describe("overview section wiring", () => {
  it("replaces the owner-only month panels with the overview and offers the Excel export", () => {
    const page = read("component.tsx");
    expect(page).toContain("<OverviewSection />");
    expect(page).not.toMatch(/RevenueTrendPanel|MonthlySummaryPanel/);
    const section = read("overview", "OverviewSection.tsx");
    expect(section).toMatch(/useAdminBranchOverview\(branchId, period, anchor\)/);
    expect(section).toContain('reportType: "BRANCH_OVERVIEW"');
    expect(section).toContain('useAdminPermission("report.export.all")');
    expect(section).toMatch(/aria-pressed=\{period === value\}/);
  });

  it("keeps the quick revenue range owner-only so managers are not sent to a 403", () => {
    expect(read("RevenuePanel.tsx")).toMatch(/canReadRangeReport \? allPresets : \["today"\]/);
  });

  it("folds payment methods past the three colour-safe slots into one 'other' entry", () => {
    expect(foldPaymentMethods([
      { method: "CASH", amount: 5_000, count: 1 },
      { method: "MASTERCARD", amount: 2_000, count: 1 },
      { method: "NO_CHARGE", amount: 0, count: 2 },
    ])).toEqual([{ method: "CASH", amount: 5_000, count: 1 }, { method: "OTHER", amount: 2_000, count: 3 }]);
    expect(foldPaymentMethods([{ method: "PAYPAY", amount: 1, count: 1 }])).toEqual([{ method: "PAYPAY", amount: 1, count: 1 }]);
  });

  it("colours payment methods by method, not by rank, and outcomes by their status meaning", () => {
    const charts = read("overview", "OverviewCharts.tsx");
    expect(charts).toMatch(/CHART_CATEGORICAL\[METHOD_SLOT\[method\]\]/);
    expect(charts).toContain('fill="var(--admin-success)"');
    expect(charts).toContain('fill="var(--admin-danger)"');
  });

  it("has the overview copy in every locale and drops the retired panels' copy", () => {
    for (const locale of ["vi", "en", "ja"]) {
      const dashboard = JSON.parse(readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8")).admin.dashboard;
      expect(dashboard.overview.actions.unreadConversations, locale).toBeTruthy();
      expect(dashboard.overview.export.download, locale).toBeTruthy();
      expect(Object.keys(dashboard.overview.periods).sort()).toEqual(["MONTH", "WEEK", "YEAR"]);
      expect(dashboard.trend).toBeUndefined();
      expect(dashboard.monthly).toBeUndefined();
    }
  });
});
