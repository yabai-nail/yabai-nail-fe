import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/service";
import { formatPeriod, payrollErrorKey, shiftMonth } from "./data";

describe("payrollErrorKey", () => {
  it("names the refusals the screen explains itself", () => {
    expect(payrollErrorKey(new ApiClientError({ message: "x", code: "PAYROLL_ALREADY_PAID" }))).toBe("alreadyPaid");
    expect(payrollErrorKey(new ApiClientError({ message: "x", code: "PAYROLL_NOT_PAID" }))).toBe("notPaid");
    expect(payrollErrorKey(new ApiClientError({ message: "x", code: "FORBIDDEN" }))).toBe("forbidden");
    expect(payrollErrorKey(new ApiClientError({ message: "x", code: "VERSION_CONFLICT" }))).toBe("conflict");
    expect(payrollErrorKey(new ApiClientError({ message: "x", code: "VALIDATION_FAILED" }))).toBeNull();
    expect(payrollErrorKey(new Error("x"))).toBeNull();
  });
});

describe("formatPeriod", () => {
  it("shows a month as MM/YYYY", () => {
    expect(formatPeriod("2026-09")).toBe("09/2026");
  });
});

describe("shiftMonth", () => {
  it("steps across year ends", () => {
    expect(shiftMonth("2026-09", 1)).toBe("2026-10");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});
