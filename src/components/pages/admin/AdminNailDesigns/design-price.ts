/** Blank removes the optional price; every stored value is whole, non-negative JPY. */
export function parseIndicativePrice(value: string): number | null | undefined {
  const normalized = value.trim().replace(/[\s,]/g, "");
  if (normalized === "") return null;
  if (!/^\d+$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}
