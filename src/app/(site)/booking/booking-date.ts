/**
 * Formats the calendar day used by booking inputs without converting through UTC.
 * A selected branch's IANA timezone wins; an unavailable/invalid timezone falls
 * back to the browser's local calendar day.
 */
export function bookingCalendarDate(now: Date, timeZone?: string | null): string {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      if (values.year && values.month && values.day) {
        return `${values.year}-${values.month}-${values.day}`;
      }
    } catch {
      // Invalid IANA timezone from branch data: use the customer's local day.
    }
  }

  return [
    String(now.getFullYear()).padStart(4, "0"),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
