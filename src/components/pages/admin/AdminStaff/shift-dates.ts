/**
 * Date arithmetic for rostering shifts over a range. Every value is a salon-local
 * "YYYY-MM-DD" key; they are read as UTC midnights so no host timezone can shift a day.
 */

import { ApiClientError } from "@/service";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The most days one "add shifts" submit may create — about two months of roster. */
export const MAX_SHIFT_DAYS = 62;

function toUtc(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function toKey(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/** Each date in the range whose weekday (0 = Sunday … 6 = Saturday) is chosen. */
export function expandShiftDates(from: string, to: string, weekdays: readonly number[]): string[] {
  const dates: string[] = [];
  for (let time = toUtc(from); time <= toUtc(to); time += DAY_MS) {
    if (weekdays.includes(new Date(time).getUTCDay())) dates.push(toKey(time));
  }
  return dates;
}

/** One month laid out Monday-first: leading nulls, then every date key (month is 0-based). */
export function monthCells(year: number, month: number): Array<string | null> {
  const first = Date.UTC(year, month, 1);
  const leading = (new Date(first).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: days }, (_, index) => toKey(first + index * DAY_MS)),
  ];
}

/**
 * Clicking a weekday header: fills that column with every pickable date, or clears it
 * when the column is already full. Dates that cannot be picked are left as they are.
 */
export function toggleWeekdayColumn(
  selected: ReadonlySet<string>,
  cells: ReadonlyArray<string | null>,
  weekday: number,
  isPickable: (date: string) => boolean,
): Set<string> {
  const column = cells.filter(
    (date): date is string => date !== null && isPickable(date) && new Date(toUtc(date)).getUTCDay() === weekday,
  );
  const next = new Set(selected);
  const full = column.every((date) => next.has(date));
  for (const date of column) {
    if (full) next.delete(date);
    else next.add(date);
  }
  return next;
}

type DateRange = { from: string; to: string };

/** Today through this week's Sunday (weeks start on Monday). */
export function weekRange(today: string): DateRange {
  const time = toUtc(today);
  const daysToSunday = (7 - new Date(time).getUTCDay()) % 7;
  return { from: today, to: toKey(time + daysToSunday * DAY_MS) };
}

/** Today through the last day of this month. */
export function monthRange(today: string): DateRange {
  const date = new Date(toUtc(today));
  return { from: today, to: toKey(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)) };
}

/** The whole of next month. */
export function nextMonthRange(today: string): DateRange {
  const date = new Date(toUtc(today));
  return {
    from: toKey(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)),
    to: toKey(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0)),
  };
}

export type ShiftBatchResult = { created: string[]; skipped: string[]; error: unknown };

/**
 * Creates one shift per date, one request at a time so the backend's per-day lock and
 * overlap check see each save. A date that already holds an overlapping shift is skipped;
 * any other failure stops the batch so the admin sees it instead of a wall of repeats.
 */
export async function createShiftsInOrder(
  dates: readonly string[],
  create: (date: string) => Promise<unknown>,
): Promise<ShiftBatchResult> {
  const result: ShiftBatchResult = { created: [], skipped: [], error: null };
  for (const date of dates) {
    try {
      await create(date);
      result.created.push(date);
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "SHIFT_OVERLAP") {
        result.skipped.push(date);
        continue;
      }
      result.error = error;
      break;
    }
  }
  return result;
}
