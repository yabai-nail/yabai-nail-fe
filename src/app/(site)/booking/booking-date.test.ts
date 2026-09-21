import { describe, expect, it } from "vitest";

import { bookingCalendarDate } from "./booking-date";

describe("bookingCalendarDate", () => {
  it("uses the branch calendar day across a UTC rollover", () => {
    const now = new Date("2026-09-21T18:36:00.000Z");

    expect(bookingCalendarDate(now, "Asia/Ho_Chi_Minh")).toBe("2026-09-22");
    expect(bookingCalendarDate(now, "Asia/Tokyo")).toBe("2026-09-22");
    expect(bookingCalendarDate(now, "UTC")).toBe("2026-09-21");
  });

  it("uses the local calendar fields when no valid branch timezone is available", () => {
    const localNow = new Date(2026, 8, 22, 0, 15);

    expect(bookingCalendarDate(localNow)).toBe("2026-09-22");
    expect(bookingCalendarDate(localNow, "Not/A-Timezone")).toBe("2026-09-22");
  });
});
