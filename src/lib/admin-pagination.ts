/** A page number, or the gap standing between two of them. */
export type PageSlot = number | "ellipsis";

/** Seven slots: first, last, the current page with a neighbour either side, and the gaps. */
const SLOTS = 7;
const EDGE_RUN = 5;

/**
 * Chooses which page numbers a pagination control should show.
 *
 * Every admin list drew one button per page, so a list long enough to need pagination was also
 * long enough to fill the footer with buttons. This keeps the count fixed: the first page, the
 * last, and the neighbourhood of the current one.
 *
 * The three branches are arranged so an ellipsis always covers at least two pages -- one hidden
 * page would take the same room as the ellipsis itself while leading nowhere.
 */
export function pageWindow(current: number, pageCount: number): PageSlot[] {
  const total = Math.max(1, Math.trunc(pageCount));
  const page = Math.min(Math.max(1, Math.trunc(current)), total);
  const all = () => Array.from({ length: total }, (_, index) => index + 1);
  if (total <= SLOTS) return all();

  const run = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
  if (page <= EDGE_RUN - 1) return [...run(1, EDGE_RUN), "ellipsis", total];
  if (page >= total - (EDGE_RUN - 2)) return [1, "ellipsis", ...run(total - (EDGE_RUN - 1), total)];
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", total];
}
