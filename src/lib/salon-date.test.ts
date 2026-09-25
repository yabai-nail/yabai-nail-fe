import { describe, expect, it } from "vitest";

import { clockInTimeZone, isoDateInTimeZone, SALON_TIME_ZONE, utcOffsetOn, zonedIso } from "./salon-date";
import { DEFAULT_TIME_ZONE } from "@/i18n/config";

describe("zonedIso", () => {
  it("honours an explicit Vietnamese branch without changing its fixture timezone", () => {
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

  it("uses the shared Tokyo default until branch data is available", () => {
    expect(SALON_TIME_ZONE).toBe(DEFAULT_TIME_ZONE);
    expect(zonedIso("2026-08-25", "14:00")).toBe("2026-08-25T14:00:00+09:00");
  });

  it("follows a DST change instead of assuming a fixed offset", () => {
    expect(utcOffsetOn("2026-01-15", "Europe/London")).toBe("+00:00");
    expect(utcOffsetOn("2026-07-15", "Europe/London")).toBe("+01:00");
  });
});

describe("isoDateInTimeZone", () => {
  it("keeps a Tokyo appointment at 09:00 when the browser runs in another timezone", () => {
    const startsAt = new Date("2026-09-25T00:00:00.000Z");
    expect(isoDateInTimeZone(startsAt, "Asia/Tokyo")).toBe("2026-09-25");
    expect(clockInTimeZone(startsAt, "Asia/Tokyo")).toBe("09:00");
  });

  it("names Tokyo's day, not UTC's, across the default-zone rollover", () => {
    const instant = new Date("2026-08-24T15:30:00Z");
    expect(instant.toISOString().slice(0, 10)).toBe("2026-08-24");
    expect(isoDateInTimeZone(instant, SALON_TIME_ZONE)).toBe("2026-08-25");
  });

  it("agrees with UTC in the middle of Tokyo's day", () => {
    const instant = new Date("2026-08-25T03:00:00Z"); // 12:00 in Tokyo
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
