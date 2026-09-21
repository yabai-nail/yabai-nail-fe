/**
 * Parses a whole-yen/minute field without turning a blank, negative value or
 * decimal into a different valid number. Grouping separators are accepted so
 * staff can paste values such as `9,000`.
 */
export function parseCatalogInteger(value: string): number | null {
  const normalized = value.trim().replace(/[\s,]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function isValidServiceAmount(value: number | null, serviceType: "BASE" | "ADD_ON") {
  return value !== null && (serviceType === "ADD_ON" ? value >= 0 : value > 0);
}
