import { ApiClientError } from "@/service";

export { currentMonth, isMonth } from "../AdminSalesReports/data";

export type PayrollErrorKey = "alreadyPaid" | "notPaid" | "forbidden" | "conflict";

/** The API refusals the screen explains in its own words; anything else shows the API's message. */
export function payrollErrorKey(error: unknown): PayrollErrorKey | null {
  if (!(error instanceof ApiClientError)) return null;
  switch (error.code) {
    case "PAYROLL_ALREADY_PAID":
      return "alreadyPaid";
    case "PAYROLL_NOT_PAID":
      return "notPaid";
    case "FORBIDDEN":
      return "forbidden";
    case "VERSION_CONFLICT":
      return "conflict";
    default:
      return null;
  }
}

/** The month label shown to people: "09/2026" from "2026-09". */
export function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  return year && month ? `${month}/${year}` : period;
}

/** The previous and next month of a `YYYY-MM`, for the month stepper. */
export function shiftMonth(period: string, delta: number): string {
  const [year, month] = period.split("-").map(Number);
  const moved = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}`;
}
