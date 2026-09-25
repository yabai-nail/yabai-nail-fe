import { DEFAULT_TIME_ZONE } from "@/i18n/config";

/**
 * "Today" for a salon is the salon's today, not the browser's and not UTC.
 * Branch-aware callers pass their stored IANA zone. Until branch data is
 * available, the shared product default is Tokyo.
 */
export const SALON_TIME_ZONE = DEFAULT_TIME_ZONE;

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

/** Wall-clock time in `HH:mm` for the given instant in the salon's zone. */
export function clockInTimeZone(
  instant: Date,
  timeZone: string = SALON_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}

/**
 * UTC offset of `timeZone` on `isoDate`, as `+07:00`. Read from the runtime's
 * own zone data rather than hardcoded, so it stays right across a DST change
 * and across branches in different countries.
 */
export function utcOffsetOn(isoDate: string, timeZone: string = SALON_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(new Date(`${isoDate}T12:00:00Z`));
  const name = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  // "GMT+07:00" -> "+07:00"; plain "GMT" (UTC) -> "+00:00".
  const offset = name.replace("GMT", "");
  return offset === "" ? "+00:00" : offset;
}

/**
 * Combines the form's local date + time into an absolute instant for the API.
 *
 * The branch zone must be passed when it is known. The default is only the
 * Japanese product fallback used before branch data is available.
 */
export function zonedIso(
  isoDate: string,
  time: string,
  timeZone: string = SALON_TIME_ZONE,
): string {
  return `${isoDate}T${time}:00${utcOffsetOn(isoDate, timeZone)}`;
}
