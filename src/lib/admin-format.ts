/**
 * The only currency the salon prices, charges and reports in. Yen has no sub-unit, so an
 * amount is a whole yen and nothing here rounds it.
 */
export const SALON_CURRENCY = "JPY";

/** Whole, non-negative yen; invalid input must not become a different saved amount. */
export function parseWholeYen(input: string): number | null {
  const plain = input.trim().replace(/^¥\s*/, "").replace(/\s*¥$/, "");
  if (!/^(?:\d+|\d{1,3}([.,])\d{3}(?:\1\d{3})*)$/.test(plain)) return null;
  const amount = Number(plain.replace(/[.,]/g, ""));
  return Number.isSafeInteger(amount) ? amount : null;
}

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: SALON_CURRENCY,
  maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
  const parts = moneyFormatter.formatToParts(value);
  const sign = parts
    .filter(({ type }) => type === "minusSign" || type === "plusSign")
    .map(({ value: part }) => part)
    .join("");
  const symbol = parts.find(({ type }) => type === "currency")?.value ?? "¥";
  const amount = parts
    .filter(({ type }) => !["currency", "literal", "minusSign", "plusSign"].includes(type))
    .map(({ value: part }) => part)
    .join("");

  return `${sign}${symbol}${amount}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export const adminFormatMeta = {
  world: "pure",
  domain: "admin-format",
} as const;
