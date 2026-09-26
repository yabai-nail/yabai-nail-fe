import { describe, expect, it } from "vitest";
import { ApiClientError, type AdminSalesReport } from "@/service";
import { decidableIds, isMonth, isReportEditable, monthBounds, paginate, reportErrorKey, summarize } from "./data";

function report(overrides: Partial<AdminSalesReport>): AdminSalesReport {
  return {
    id: "r", branchId: "b", staffId: "s", reportedByAccountId: null, reportDate: "2026-09-18", servedAt: null, platform: "MINIMO",
    coursePrice: 10000, accessoryAmount: 0, grossAmount: 10000, platformFee: 880, staffFeeShare: 880, salonFeeShare: 0, staffRatePercent: 55,
    staffAmount: 4620, salonAmount: 4500, paymentMethod: "CASH", note: "", status: "PENDING", rejectionReason: null, decidedBy: null, decidedAt: null,
    appointmentId: null, paymentId: null, payrollPeriodId: null, locked: false, version: 1, createdAt: null, updatedAt: null,
    ...overrides,
  };
}

describe("monthBounds", () => {
  it("gives the first and last day of the month, inclusive", () => {
    expect(monthBounds("2026-09")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(monthBounds("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(monthBounds("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(monthBounds("2026-12")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });

  it("isMonth accepts only YYYY-MM", () => {
    expect(isMonth("2026-09")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("2026-9")).toBe(false);
  });
});

describe("summarize", () => {
  it("deducts refund amounts without counting adjustments as extra customers", () => {
    expect(summarize([
      report({ grossAmount: 5000, platformFee: 0, staffAmount: 500, salonAmount: 4500 }),
      report({ id: "refund", refundOfReportId: "r", grossAmount: -2000, platformFee: 0, staffAmount: -200, salonAmount: -1800 }),
    ])).toEqual({ count: 1, grossTotal: 3000, feeTotal: 0, staffTotal: 300, salonTotal: 2700 });
  });
  it("adds the money columns of the given reports", () => {
    expect(summarize([report({}), report({ id: "r2", grossAmount: 12000, platformFee: 880, staffAmount: 5720, salonAmount: 5400 })])).toEqual({
      count: 2, grossTotal: 22000, feeTotal: 1760, staffTotal: 10340, salonTotal: 9900,
    });
    expect(summarize([])).toEqual({ count: 0, grossTotal: 0, feeTotal: 0, staffTotal: 0, salonTotal: 0 });
  });
});

describe("paginate", () => {
  it("slices a page and clamps the page number", () => {
    const items = Array.from({ length: 45 }, (_, index) => index);
    expect(paginate(items, 3, 20)).toEqual({ items: [40, 41, 42, 43, 44], page: 3, pageCount: 3 });
    expect(paginate(items, 9, 20).page).toBe(3);
    expect(paginate([], 1, 20)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});

describe("decidableIds", () => {
  it("cannot independently approve automatic reversals but allows the source report", () => {
    const items = [report({ id: "source", paymentId: "capture" }), report({ id: "refund", refundOfReportId: "source", paymentId: "refund-payment" })];
    expect(decidableIds(items, new Set(["source", "refund"]))).toEqual(["source"]);
  });
  it("keeps only the selected reports that are pending and unlocked", () => {
    const items = [report({ id: "a" }), report({ id: "b", status: "APPROVED" }), report({ id: "c", locked: true }), report({ id: "d" })];
    expect(decidableIds(items, new Set(["a", "b", "c"]))).toEqual(["a"]);
  });
});

describe("isReportEditable", () => {
  it("allows manual open reports only", () => {
    expect(isReportEditable(report({}))).toBe(true);
    expect(isReportEditable(report({ locked: true }))).toBe(false);
    expect(isReportEditable(report({ paymentId: "capture" }))).toBe(false);
    expect(isReportEditable(report({ refundOfReportId: "source" }))).toBe(false);
  });
});

describe("reportErrorKey", () => {
  it("names the refusals the screen explains itself", () => {
    expect(reportErrorKey(new ApiClientError({ message: "x", code: "SALES_REPORT_LOCKED" }))).toBe("locked");
    expect(reportErrorKey(new ApiClientError({ message: "x", code: "VERSION_CONFLICT" }))).toBe("conflict");
    expect(reportErrorKey(new ApiClientError({ message: "x", code: "FORBIDDEN" }))).toBe("forbidden");
    expect(reportErrorKey(new ApiClientError({ message: "x", code: "REPORT_DATE_OUT_OF_RANGE" }))).toBe("dateOutOfRange");
    expect(reportErrorKey(new ApiClientError({ message: "x", code: "VALIDATION_FAILED" }))).toBeNull();
    expect(reportErrorKey(new Error("x"))).toBeNull();
  });
});
