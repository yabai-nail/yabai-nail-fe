import { describe, expect, it } from "vitest";

import { isoDateInTimeZone, SALON_TIME_ZONE } from "./salon-date";

describe("isoDateInTimeZone", () => {
  it("names the salon's day, not UTC's, in the early morning", () => {
    // 2026-08-25T01:00 in Ho Chi Minh is still 2026-08-24T18:00 UTC. The old
    // toISOString().slice(0,10) returned the 24th here — a whole day of
    // bookings the admin could not see.
    const instant = new Date("2026-08-24T18:00:00Z");
    expect(instant.toISOString().slice(0, 10)).toBe("2026-08-24");
    expect(isoDateInTimeZone(instant, SALON_TIME_ZONE)).toBe("2026-08-25");
  });

  it("agrees with UTC in the middle of the salon's day", () => {
    const instant = new Date("2026-08-25T05:00:00Z"); // 12:00 in Ho Chi Minh
    expect(isoDateInTimeZone(instant, SALON_TIME_ZONE)).toBe("2026-08-25");
  });

  it("formats as YYYY-MM-DD with padding", () => {
    const instant = new Date("2026-01-05T05:00:00Z");
    expect(isoDateInTimeZone(instant, SALON_TIME_ZONE)).toBe("2026-01-05");
  });

  it("honours an explicit zone so a branch can override the default", () => {
    const instant = new Date("2026-08-24T18:00:00Z");
    expect(isoDateInTimeZone(instant, "UTC")).toBe("2026-08-24");
  });
});
