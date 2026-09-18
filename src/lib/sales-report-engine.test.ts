import { describe, expect, it } from "vitest";
import { SALES_PLATFORMS, platformFee, splitSalesReport } from "./sales-report-engine";

/**
 * A copy of the API's engine so the form can show the split before it is sent. The API's
 * figures are the ones stored; this only has to agree with them, so it is pinned to the same
 * worked examples (docs/payroll-sales-reports.md §3.1 in the platform repo).
 */
describe("splitSalesReport", () => {
  it.each([
    { name: "NAILIE new, 55%", input: { platform: "NAILIE_NEW", coursePrice: 8000, accessoryAmount: 2000, staffRatePercent: 55 }, expected: { platformFee: 3520, staffFeeShare: 1760, salonFeeShare: 1760, staffAmount: 3740, salonAmount: 2740 } },
    { name: "NAILIE returning, 55%", input: { platform: "NAILIE_RETURNING", coursePrice: 10000, accessoryAmount: 0, staffRatePercent: 55 }, expected: { platformFee: 520, staffFeeShare: 520, salonFeeShare: 0, staffAmount: 4980, salonAmount: 4500 } },
    { name: "MINIMO, 55%", input: { platform: "MINIMO", coursePrice: 10000, accessoryAmount: 0, staffRatePercent: 55 }, expected: { platformFee: 880, staffAmount: 4620, salonAmount: 4500 } },
    { name: "MINIMO, 40%", input: { platform: "MINIMO", coursePrice: 10000, accessoryAmount: 0, staffRatePercent: 40 }, expected: { platformFee: 880, staffAmount: 3120, salonAmount: 6000 } },
    { name: "HOT PEPPER above 5,000", input: { platform: "HOT_PEPPER", coursePrice: 8000, accessoryAmount: 2000, staffRatePercent: 55 }, expected: { platformFee: 500, staffAmount: 5000, salonAmount: 4500 } },
    { name: "HOT PEPPER at 5,000 plus accessories", input: { platform: "HOT_PEPPER", coursePrice: 5000, accessoryAmount: 5000, staffRatePercent: 55 }, expected: { platformFee: 0, staffAmount: 5500, salonAmount: 4500 } },
    { name: "APP, 50%", input: { platform: "APP", coursePrice: 10000, accessoryAmount: 0, staffRatePercent: 50 }, expected: { platformFee: 0, staffAmount: 5000, salonAmount: 5000 } },
    { name: "APP, 40%", input: { platform: "APP", coursePrice: 10000, accessoryAmount: 0, staffRatePercent: 40 }, expected: { platformFee: 0, staffAmount: 4000, salonAmount: 6000 } },
  ] as const)("$name", ({ input, expected }) => {
    const split = splitSalesReport(input);
    expect(split).toMatchObject({ grossAmount: 10000, ...expected });
    expect(split.staffAmount + split.salonAmount + split.platformFee).toBe(split.grossAmount);
  });

  it("splits an odd NAILIE fee with the smaller half on the technician", () => {
    const split = splitSalesReport({ platform: "NAILIE_NEW", coursePrice: 10003, accessoryAmount: 0, staffRatePercent: 55 });
    expect(split).toMatchObject({ platformFee: 3521, staffFeeShare: 1760, salonFeeShare: 1761 });
  });

  it("rejects amounts that are not whole, non-negative yen and rates outside 0 to 100", () => {
    expect(() => splitSalesReport({ platform: "APP", coursePrice: -1, accessoryAmount: 0, staffRatePercent: 50 })).toThrow(RangeError);
    expect(() => splitSalesReport({ platform: "APP", coursePrice: 10.5, accessoryAmount: 0, staffRatePercent: 50 })).toThrow(RangeError);
    expect(() => splitSalesReport({ platform: "APP", coursePrice: 100, accessoryAmount: 0, staffRatePercent: 101 })).toThrow(RangeError);
  });
});

describe("platformFee", () => {
  it("follows the MINIMO tiers on the gross and the HOT PEPPER threshold on the course", () => {
    expect(platformFee("MINIMO", 2000, 2000)).toBe(440);
    expect(platformFee("MINIMO", 2001, 2001)).toBe(660);
    expect(platformFee("MINIMO", 6001, 6001)).toBe(880);
    expect(platformFee("HOT_PEPPER", 5000, 9000)).toBe(0);
    expect(platformFee("HOT_PEPPER", 5001, 5001)).toBe(500);
  });

  it("lists the platforms in the owner's order", () => {
    expect(SALES_PLATFORMS).toEqual(["NAILIE_NEW", "NAILIE_RETURNING", "MINIMO", "HOT_PEPPER", "APP"]);
  });
});
