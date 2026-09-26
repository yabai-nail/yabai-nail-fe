import type { AdminOverviewPeriod } from "@/service";

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parts(localDate: string): [number, number, number] {
  const match = DATE.exec(localDate);
  if (!match) throw new RangeError(`Not a YYYY-MM-DD date: ${localDate}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

const iso = (date: Date) => date.toISOString().slice(0, 10);

/**
 * The anchor date of the window `step` periods away from the one starting at `from`. The API
 * resolves any date inside a window to that window, so the first day is a safe anchor.
 */
export function shiftOverviewAnchor(from: string, period: AdminOverviewPeriod, step: number): string {
  const [year, month, day] = parts(from);
  if (period === "WEEK") return iso(new Date(Date.UTC(year, month - 1, day + 7 * step)));
  if (period === "MONTH") return iso(new Date(Date.UTC(year, month - 1 + step, 1)));
  return `${year + step}-01-01`;
}

/** True while the window still contains `today`, so there is no later window with data yet. */
export function isCurrentOrFutureWindow(toExclusive: string, today: string): boolean {
  return toExclusive > today;
}

/** "21/09 – 27/09/2026", "tháng 9 năm 2026", "2026" in the viewer's locale. */
export function formatPeriodLabel(range: { period: AdminOverviewPeriod; from: string; toExclusive: string }, locale: string): string {
  const [year, month, day] = parts(range.from);
  const first = new Date(Date.UTC(year, month - 1, day));
  if (range.period === "YEAR") return String(year);
  if (range.period === "MONTH") return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const [ey, em, ed] = parts(range.toExclusive);
  const last = new Date(Date.UTC(ey, em - 1, ed - 1));
  const short = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  const full = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  return `${short.format(first)} – ${full.format(last)}`;
}

/** Axis label of one bucket: "21/9" for a day, a short month name for a month. */
export function formatBucketLabel(bucket: string, granularity: "DAY" | "MONTH", locale: string): string {
  if (granularity === "MONTH") {
    const [year, month] = bucket.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  const [, month, day] = parts(bucket);
  return `${day}/${month}`;
}

/** Yen axis ticks: full amounts are too wide, so 46 800 -> "47K", 1 200 000 -> "1.2M". */
export function compactYen(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

/** Share of `part` in `total` as a whole percent, 0 when there is no total. */
export function sharePercent(part: number, total: number): number {
  return total > 0 ? Math.round((part * 100) / total) : 0;
}
