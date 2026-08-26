import { describe, expect, it } from "vitest";
import {
  formatReportValue,
  humanizeKey,
  labelForKey,
  metricCards,
  resolveReportIdentifiers,
  revenueFixture,
  tableColumns,
} from "./data";

describe("report derivation", () => {
  it("humanizes camelCase keys", () => {
    expect(humanizeKey("grossRevenue")).toBe("Gross Revenue");
    expect(humanizeKey("new_customers")).toBe("New customers");
  });

  it("prefers a known label, falls back to humanized key", () => {
    expect(labelForKey("appointments")).toBe("Lượt hẹn");
    expect(labelForKey("someUnknownKey")).toBe("Some Unknown Key");
  });

  it("formats currency keys as yen and plain numbers otherwise", () => {
    expect(formatReportValue("revenue", 1000000)).toBe("1.000.000 ¥");
    expect(formatReportValue("appointments", 12)).toBe("12");
    expect(formatReportValue("appointments", null)).toBe("—");
    expect(formatReportValue("note", "abc")).toBe("abc");
  });

  it("builds metric cards from the revenue report", () => {
    const cards = metricCards(revenueFixture);
    expect(cards.map((card) => card.key)).toContain("grossRevenue");
    expect(cards.find((card) => card.key === "appointments")?.display).toBe("142");
    expect(metricCards(undefined)).toEqual([]);
  });

  it("derives the union of columns across rows", () => {
    const columns = tableColumns([{ a: 1, b: 2 }, { a: 3, c: 4 }]);
    expect(columns).toEqual(["a", "b", "c"]);
  });

  it("replaces technical identifier columns with names", () => {
    const rows = resolveReportIdentifiers(
      [{ branchId: "branch-1", staffId: "staff-1", appointmentId: "hidden", revenueVnd: 1000 }],
      {
        branches: new Map([["branch-1", "YABAI Thảo Điền"]]),
        staff: new Map([["staff-1", "Mai Linh"]]),
      },
    );
    expect(rows).toEqual([{
      branchName: "YABAI Thảo Điền",
      staffName: "Mai Linh",
      revenueVnd: 1000,
    }]);
  });
});
