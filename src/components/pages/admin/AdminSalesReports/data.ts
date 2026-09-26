import { ApiClientError, type AdminSalesReport } from "@/service";
import { todayAtSalon } from "@/lib/salon-date";

export const REPORT_PAGE_SIZE = 20;
/** The API caps a page at 100; the screen asks for the most it can and pages further by cursor. */
export const REPORT_FETCH_LIMIT = 100;

export { parseWholeYen as parseReportAmount } from "@/lib/admin-format";

/** `YYYY-MM` of today in the branch's zone. */
export function currentMonth(timeZone?: string): string {
  return todayAtSalon(timeZone).slice(0, 7);
}

export function isMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** First and last calendar day of a `YYYY-MM` month, both inclusive, for the API's from/to filter. */
export function monthBounds(period: string): { readonly from: string; readonly to: string } {
  const [year, month] = period.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${period}-01`, to: `${period}-${String(last).padStart(2, "0")}` };
}

export interface ReportSummary {
  readonly count: number;
  readonly grossTotal: number;
  readonly feeTotal: number;
  readonly staffTotal: number;
  readonly salonTotal: number;
}

export function summarize(items: ReadonlyArray<AdminSalesReport>): ReportSummary {
  return items.reduce<ReportSummary>(
    (sum, item) => ({
      count: sum.count + (item.refundOfReportId ? 0 : 1),
      grossTotal: sum.grossTotal + item.grossAmount,
      feeTotal: sum.feeTotal + item.platformFee,
      staffTotal: sum.staffTotal + item.staffAmount,
      salonTotal: sum.salonTotal + item.salonAmount,
    }),
    { count: 0, grossTotal: 0, feeTotal: 0, staffTotal: 0, salonTotal: 0 },
  );
}

export function paginate<T>(items: ReadonlyArray<T>, page: number, pageSize: number): { readonly items: ReadonlyArray<T>; readonly page: number; readonly pageCount: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pageCount };
}

/** The selected reports a batch approval can actually take: pending and not locked. */
export function decidableIds(items: ReadonlyArray<AdminSalesReport>, selected: ReadonlySet<string>): string[] {
  return items.filter((item) => selected.has(item.id) && item.status === "PENDING" && !item.locked && !item.refundOfReportId).map((item) => item.id);
}

/** Payment-generated entries are immutable; corrections belong to the refund ledger. */
export function isReportEditable(item: AdminSalesReport): boolean {
  return !item.locked && !item.paymentId && !item.refundOfReportId;
}

export type ReportErrorKey = "locked" | "conflict" | "forbidden" | "dateOutOfRange";

/** The API refusals the screen explains in its own words; anything else shows the API's message. */
export function reportErrorKey(error: unknown): ReportErrorKey | null {
  if (!(error instanceof ApiClientError)) return null;
  switch (error.code) {
    case "SALES_REPORT_LOCKED":
      return "locked";
    case "VERSION_CONFLICT":
    case "PRECONDITION_REQUIRED":
      return "conflict";
    case "FORBIDDEN":
      return "forbidden";
    case "REPORT_DATE_OUT_OF_RANGE":
      return "dateOutOfRange";
    default:
      return null;
  }
}
