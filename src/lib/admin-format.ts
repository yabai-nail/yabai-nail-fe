/**
 * The only currency the salon prices, charges and reports in. Yen has no sub-unit, so an
 * amount is a whole yen and nothing here rounds it.
 */
export const SALON_CURRENCY = "JPY";

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: SALON_CURRENCY,
  maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export const adminFormatMeta = {
  world: "pure",
  domain: "admin-format",
} as const;
