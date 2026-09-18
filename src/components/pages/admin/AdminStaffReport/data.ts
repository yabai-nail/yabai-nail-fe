import type { AdminSalesReport } from "@/service";

export interface DayGroup {
  readonly date: string;
  readonly rows: ReadonlyArray<AdminSalesReport>;
  /** The technician's share for the day, across every status. */
  readonly mine: number;
}

/** Reports grouped by day, newest day first, in the order they were listed within a day. */
export function groupByDay(items: ReadonlyArray<AdminSalesReport>): ReadonlyArray<DayGroup> {
  const byDate = new Map<string, AdminSalesReport[]>();
  for (const item of items) byDate.set(item.reportDate, [...(byDate.get(item.reportDate) ?? []), item]);
  return Array.from(byDate.entries())
    .sort(([left], [right]) => (left < right ? 1 : left > right ? -1 : 0))
    .map(([date, rows]) => ({ date, rows, mine: rows.reduce((sum, row) => sum + row.staffAmount, 0) }));
}
