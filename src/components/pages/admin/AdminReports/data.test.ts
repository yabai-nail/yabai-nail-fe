import { describe, expect, it } from "vitest";
import {
  exportStatusLabel,
  formatReportValue,
  humanizeKey,
  labelForKey,
  metricCards,
  resolveReportIdentifiers,
  revenueFixture,
  tableColumns,
} from "./data";

/**
 * A translator that answers the key it was given. The assertions below are about the
 * functions reaching for the right key -- what those keys say in Vietnamese, Japanese
 * or English is the catalogue's business, and the key-parity check guards that.
 */
const t = Object.assign((key: string) => key, {
  has: (key: string) => KNOWN.has(key),
});
const KNOWN = new Set(["exportStatus.QUEUED", "exportStatus.PROCESSING", "exportStatus.READY", "exportStatus.FAILED", "columns.appointments"]);

describe("report derivation", () => {
  it.each([
    ["QUEUED", "exportStatus.QUEUED"],
    ["PROCESSING", "exportStatus.PROCESSING"],
    ["READY", "exportStatus.READY"],
    ["FAILED", "exportStatus.FAILED"],
    // An export state the catalogue does not name still has to render something.
    ["SOMETHING_NEW", "exportStatus.unknown"],
  ])("looks up export status %s", (status, expected) => {
    expect(exportStatusLabel(status, t)).toBe(expected);
  });

  it("humanizes camelCase keys", () => {
    expect(humanizeKey("grossRevenue")).toBe("Gross Revenue");
    expect(humanizeKey("new_customers")).toBe("New customers");
  });

  it("prefers a known label, falls back to humanized key", () => {
    expect(labelForKey("appointments", t)).toBe("columns.appointments");
    expect(labelForKey("someUnknownKey", t)).toBe("Some Unknown Key");
  });

  it("formats currency keys as yen and plain numbers otherwise", () => {
    expect(formatReportValue("revenue", 1000000)).toBe("1.000.000 ¥");
    expect(formatReportValue("appointments", 12)).toBe("12");
    expect(formatReportValue("appointments", null)).toBe("—");
    expect(formatReportValue("note", "abc")).toBe("abc");
  });

  it("builds metric cards from the revenue report", () => {
    const cards = metricCards(revenueFixture, t);
    expect(cards.map((card) => card.key)).toContain("grossRevenue");
    expect(cards.find((card) => card.key === "appointments")?.display).toBe("142");
    expect(metricCards(undefined, t)).toEqual([]);
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
      t,
    );
    expect(rows).toEqual([{
      branchName: "YABAI Thảo Điền",
      staffName: "Mai Linh",
      revenueVnd: 1000,
    }]);
  });

  // An id with no name behind it must not surface as the raw uuid, which is the
  // defect this whole resolver exists to prevent.
  it("names an unresolved identifier from the catalogue instead of leaking the id", () => {
    const rows = resolveReportIdentifiers([{ customerId: "cust-9" }], {}, t);

    expect(rows).toEqual([{ customerName: "unnamedCustomer" }]);
  });
});
