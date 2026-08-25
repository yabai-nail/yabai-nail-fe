import { describe, expect, it } from "vitest";

import { isQuarterHour } from "./StaffShiftsPanel";

// The shift endpoint rejects any minute that is not a quarter-hour boundary.
// Checking it in the form means the admin is told before submitting instead of
// after a 422 that names three possible causes at once.
describe("isQuarterHour", () => {
  it("accepts quarter-hour boundaries", () => {
    for (const time of ["09:00", "09:15", "13:30", "23:45"]) {
      expect(isQuarterHour(time)).toBe(true);
    }
  });

  it("rejects any other minute", () => {
    for (const time of ["09:01", "09:07", "13:29", "23:44"]) {
      expect(isQuarterHour(time)).toBe(false);
    }
  });

  it("rejects malformed input rather than throwing", () => {
    for (const time of ["", "9:00", "0900", "ab:cd"]) {
      expect(isQuarterHour(time)).toBe(false);
    }
  });
});
