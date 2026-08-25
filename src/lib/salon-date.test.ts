import { describe, expect, it } from "vitest";

import { isoDateInTimeZone, SALON_TIME_ZONE, utcOffsetOn, zonedIso } from "./salon-date";

describe("zonedIso", () => {
  it("uses the branch's real offset, not a hardcoded Tokyo one", () => {
    // The live branch is Asia/Ho_Chi_Minh. The old code appended +09:00, so
    // 14:00 typed by the salon was stored as 12:00 their time.
    expect(zonedIso("2026-08-25", "14:00", "Asia/Ho_Chi_Minh")).toBe(
      "2026-08-25T14:00:00+07:00",
    );
    expect(new Date(zonedIso("2026-08-25", "14:00", "Asia/Ho_Chi_Minh")).toISOString()).toBe(
      "2026-08-25T07:00:00.000Z",
    );
  });

  it("still serves a Tokyo branch correctly", () => {
    expect(zonedIso("2026-08-25", "14:00", "Asia/Tokyo")).toBe("2026-08-25T14:00:00+09:00");
  });

  it("follows a DST change instead of assuming a fixed offset", () => {
    expect(utcOffsetOn("2026-01-15", "Europe/London")).toBe("+00:00");
    expect(utcOffsetOn("2026-07-15", "Europe/London")).toBe("+01:00");
  });
});

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
