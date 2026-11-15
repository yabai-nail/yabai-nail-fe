import type { ReactNode } from "react";
import { nextAdminTableSort, type AdminTableSort } from "@/lib/admin-table-sort";

// The stacked up/down carets of a sortable column; the active direction takes the accent.
function SortCarets({ direction }: Readonly<{ direction: "asc" | "desc" | null }>) {
  const tone = (on: boolean) => (on ? "fill-admin-accent" : "fill-current opacity-40");
  return (
    <span aria-hidden className="flex shrink-0 flex-col gap-0.5">
      <svg viewBox="0 0 10 6" className={`h-1.5 w-2.5 ${tone(direction === "asc")}`}><path d="M5 0 10 6H0z" /></svg>
      <svg viewBox="0 0 10 6" className={`h-1.5 w-2.5 ${tone(direction === "desc")}`}><path d="M0 0h10L5 6z" /></svg>
    </span>
  );
}

/**
 * An admin table header cell in the Ant Design shape: click the title to sort (stacked carets
 * show the direction) and an optional filter control sits beside it. Shared by every admin
 * table that sorts, so they all read and behave alike. A column that does not sort leaves out
 * `sortKey` and the two sort props, and renders as a plain title in the same cell style.
 */
export function _AdminSortableHeader<K extends string>({
  sortKey,
  sort,
  onSortChange,
  filter,
  className = "px-3",
  children,
}: Readonly<{
  sortKey?: K;
  sort?: AdminTableSort<K> | null;
  onSortChange?: (next: AdminTableSort<K> | null) => void;
  filter?: ReactNode;
  className?: string;
  children: ReactNode;
}>) {
  const direction = sortKey && sort?.key === sortKey ? sort.direction : null;
  return (
    <th
      scope="col"
      // One line per header: a wrapped title also pushed its carets to the far edge of the cell.
      className={`${className} whitespace-nowrap py-2`}
      aria-sort={!sortKey ? undefined : direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
    >
      <div className="flex items-center gap-1">
        {sortKey ? (
          <button
            type="button"
            className="-mx-1 inline-flex min-h-8 items-center gap-1.5 rounded-md px-1 text-left outline-none hover:bg-admin-soft focus-visible:ring-2 focus-visible:ring-admin-accent"
            onClick={() => onSortChange?.(nextAdminTableSort(sort ?? null, sortKey))}
          >
            {children}
            <SortCarets direction={direction} />
          </button>
        ) : (
          <span className="inline-flex min-h-8 items-center">{children}</span>
        )}
        {filter}
      </div>
    </th>
  );
}

export const meta = { world: "pure", domain: "admin-sortable-header" } as const;
