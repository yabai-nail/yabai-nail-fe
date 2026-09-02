import { matchesSearch } from "@/lib/admin-search";
import type { AdminServiceCategory } from "@/service";

/** Search over what the salon actually reads on screen: the display name and the code. */
export function filterCategories(
  categories: ReadonlyArray<AdminServiceCategory>,
  query: string,
): ReadonlyArray<AdminServiceCategory> {
  return categories.filter((category) =>
    matchesSearch(query, [category.nameVi, category.name, category.code]),
  );
}

/**
 * Reorders one category and hands back a new list. A drop outside the list is a no-op rather
 * than a deletion -- `splice` would happily drop the dragged row on the floor.
 */
export function moveCategory(
  orderedIds: ReadonlyArray<string>,
  from: number,
  to: number,
): string[] {
  const withinRange = (index: number) => index >= 0 && index < orderedIds.length;
  if (!withinRange(from) || !withinRange(to) || from === to) return [...orderedIds];
  const next = [...orderedIds];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
