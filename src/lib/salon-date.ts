/**
 * "Today" for a salon is the salon's today, not the browser's and not UTC.
 *
 * `new Date().toISOString().slice(0, 10)` — the pattern this replaces — is UTC,
 * so between 00:00 and 07:00 in Vietnam (UTC+7) it names yesterday. An admin
 * opening the calendar at 1am would be shown the previous day's bookings.
 */
export const SALON_TIME_ZONE = "Asia/Ho_Chi_Minh";

/**
 * Calendar date in `YYYY-MM-DD` for the given instant in the given zone.
 * `en-CA` is the locale whose short date format already *is* `YYYY-MM-DD`,
 * which avoids hand-assembling parts.
 */
export function isoDateInTimeZone(
  instant: Date,
  timeZone: string = SALON_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Today's calendar date at the salon. Pass the branch zone once the API supplies it. */
export function todayAtSalon(timeZone: string = SALON_TIME_ZONE): string {
  return isoDateInTimeZone(new Date(), timeZone);
}
