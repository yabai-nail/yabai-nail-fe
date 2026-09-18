/**
 * Splits one customer's payment between the booking platform, the technician and the salon.
 *
 * A port of the API's `payroll/sales-report-engine.ts`, so the report form can show the
 * technician what they will earn before the report is sent. The API recomputes and stores
 * the figures; this copy only has to agree with it, which its test pins to the same worked
 * examples. Whole yen throughout.
 */

export type SalesPlatform = "NAILIE_NEW" | "NAILIE_RETURNING" | "MINIMO" | "HOT_PEPPER" | "APP";

/** In the order the owner listed them; the form shows them in this order. */
export const SALES_PLATFORMS: ReadonlyArray<SalesPlatform> = ["NAILIE_NEW", "NAILIE_RETURNING", "MINIMO", "HOT_PEPPER", "APP"];

export const SALES_PAYMENT_METHODS = ["CASH", "PAYPAY", "VISA", "MASTERCARD"] as const;
export type SalesPaymentMethod = (typeof SALES_PAYMENT_METHODS)[number];

export interface SalesReportInput {
  readonly platform: SalesPlatform;
  readonly coursePrice: number;
  readonly accessoryAmount: number;
  readonly staffRatePercent: number;
}

export interface SalesReportSplit {
  readonly grossAmount: number;
  readonly platformFee: number;
  readonly staffFeeShare: number;
  readonly salonFeeShare: number;
  readonly staffRatePercent: number;
  readonly staffAmount: number;
  readonly salonAmount: number;
}

/** The platform's fee on one job: HOT PEPPER thresholds on the course price, NAILIE and MINIMO on the gross. */
export function platformFee(platform: SalesPlatform, coursePrice: number, grossAmount: number): number {
  switch (platform) {
    case "NAILIE_NEW":
      return Math.round((grossAmount * 336) / 1000) + 160;
    case "NAILIE_RETURNING":
      return Math.round((grossAmount * 36) / 1000) + 160;
    case "MINIMO":
      return grossAmount <= 2000 ? 440 : grossAmount <= 6000 ? 660 : 880;
    case "HOT_PEPPER":
      return coursePrice <= 5000 ? 0 : 500;
    case "APP":
      return 0;
  }
}

function assertYen(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) throw new RangeError(`${name} must be a whole, non-negative number of yen`);
}

/** Invariant: `staffAmount + salonAmount + platformFee === grossAmount`. */
export function splitSalesReport(input: SalesReportInput): SalesReportSplit {
  if (!SALES_PLATFORMS.includes(input.platform)) throw new RangeError(`unknown platform ${String(input.platform)}`);
  assertYen("coursePrice", input.coursePrice);
  assertYen("accessoryAmount", input.accessoryAmount);
  if (!Number.isFinite(input.staffRatePercent) || input.staffRatePercent < 0 || input.staffRatePercent > 100) {
    throw new RangeError("staffRatePercent must be between 0 and 100");
  }

  const grossAmount = input.coursePrice + input.accessoryAmount;
  const fee = platformFee(input.platform, input.coursePrice, grossAmount);
  // NAILIE's new-customer fee is shared half and half, the odd yen going to the salon; every other fee is the technician's.
  const staffFeeShare = input.platform === "NAILIE_NEW" ? Math.floor(fee / 2) : fee;
  const salonFeeShare = fee - staffFeeShare;
  const staffGross = Math.round((grossAmount * input.staffRatePercent) / 100);

  return {
    grossAmount,
    platformFee: fee,
    staffFeeShare,
    salonFeeShare,
    staffRatePercent: input.staffRatePercent,
    staffAmount: staffGross - staffFeeShare,
    salonAmount: grossAmount - staffGross - salonFeeShare,
  };
}
