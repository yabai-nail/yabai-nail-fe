/**
 * Ordering and search for price tiers (Mức giá), shared by the tier panel and every tier picker.
 *
 * The API already returns tiers pinned first, then by amount, name and id. The same order is
 * applied here as well, so a list stays right while an optimistic or partial update is showing,
 * and so a tier saved by an older API (no `isPinned`) counts as unpinned.
 */
export interface SearchableTier {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly isPinned?: boolean;
}

/** A tier from an API that predates pinning has no `isPinned`; it reads as unpinned. */
export const isPinnedTier = (tier: SearchableTier): boolean => tier.isPinned === true;

/** Pinned first, then amount ascending, then name, then id: the API's order. */
export function compareTiers(a: SearchableTier, b: SearchableTier): number {
  const pinned = Number(isPinnedTier(b)) - Number(isPinnedTier(a));
  if (pinned !== 0) return pinned;
  if (a.amount !== b.amount) return a.amount - b.amount;
  const name = a.name.localeCompare(b.name);
  if (name !== 0) return name;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function sortTiers<T extends SearchableTier>(tiers: ReadonlyArray<T>): ReadonlyArray<T> {
  return [...tiers].sort(compareTiers);
}

/** Table sorting keeps pinned tiers first; picker ordering remains unchanged. */
export function sortTierTable<T extends SearchableTier>(
  tiers: ReadonlyArray<T>,
  sort: { readonly key: "name" | "amount"; readonly direction: "asc" | "desc" } | null,
): ReadonlyArray<T> {
  if (!sort) return sortTiers(tiers);
  return [...tiers].sort((a, b) => {
    const pinned = Number(isPinnedTier(b)) - Number(isPinnedTier(a));
    const compared = sort.key === "amount" ? a.amount - b.amount : a.name.localeCompare(b.name);
    return pinned || compared * (sort.direction === "asc" ? 1 : -1) || compareTiers(a, b);
  });
}

/** Lower case without accents, so "muc gia" finds "Mức giá" and full-width input matches. */
function fold(text: string): string {
  return text.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLocaleLowerCase().trim();
}

/** "¥6,600", "6.600 円" and "6600" all mean the amount 6600; anything else is not an amount. */
function amountDigits(query: string): string | null {
  const digits = query.normalize("NFKC").replace(/[¥￥円,.\s]/g, "");
  return /^\d+$/.test(digits) ? digits : null;
}

/** Whether a tier matches what was typed: by name, or by amount when the query is a number. */
export function matchesTierQuery(tier: SearchableTier, query: string): boolean {
  const folded = fold(query);
  if (folded === "") return true;
  if (fold(tier.name).includes(folded)) return true;
  const digits = amountDigits(query);
  return digits !== null && String(tier.amount).includes(digits);
}

/** The tiers to list: optionally only the pinned ones, matching the query, in the API's order. */
export function filterTiers<T extends SearchableTier>(
  tiers: ReadonlyArray<T>,
  { query = "", pinnedOnly = false }: { readonly query?: string; readonly pinnedOnly?: boolean } = {},
): ReadonlyArray<T> {
  return sortTiers(tiers.filter((tier) => (!pinnedOnly || isPinnedTier(tier)) && matchesTierQuery(tier, query)));
}

/**
 * A picker shows at most `limit` matches, so a long tier list never renders hundreds of options.
 * `total` is how many matched, so the picker can say some are not shown and ask for more letters.
 */
export function tierPickerResults<T extends SearchableTier>(
  tiers: ReadonlyArray<T>,
  query: string,
  limit: number,
): { readonly items: ReadonlyArray<T>; readonly total: number } {
  const matched = filterTiers(tiers, { query });
  return { items: matched.slice(0, limit), total: matched.length };
}

/**
 * Where the highlighted option moves for a key in the open list, or `null` when the key is not a
 * list-navigation key. Arrow keys wrap around. Home and End are left to the text box (they move
 * the caret there), as the ARIA editable-combobox pattern expects.
 */
export function nextActiveIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null;
  if (key === "ArrowDown") return current < 0 || current >= count - 1 ? 0 : current + 1;
  if (key === "ArrowUp") return current <= 0 ? count - 1 : current - 1;
  return null;
}
