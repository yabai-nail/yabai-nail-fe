import { describe, expect, it } from "vitest";
import {
  formatAppointmentDateLabel,
  getAppointmentViewRange,
  shiftAppointmentDate,
} from "./date-utils";

import type { Translator } from "@/i18n/config";

/**
 * Echoes the key with its interpolations appended, so the assertions below name the key and
 * the values passed into it rather than the Vietnamese the catalogue happens to hold.
 */
const t = Object.assign(
  (key: string, values?: Record<string, string | number>) =>
    values
      ? `${key}(${Object.entries(values).map(([k, v]) => `${k}=${v}`).join(",")})`
      : key,
  { has: () => true },
) as unknown as Translator;

describe("appointment date utilities", () => {
  it("shifts the selected date according to the active view", () => {
    expect(shiftAppointmentDate("2026-08-16", "day", 1)).toBe("2026-08-17");
    expect(shiftAppointmentDate("2026-08-16", "week", -1)).toBe("2026-08-09");
    expect(shiftAppointmentDate("2026-08-31", "month", 1)).toBe("2026-09-30");
  });

  it("returns an inclusive range for each view", () => {
    expect(getAppointmentViewRange("2026-08-16", "day")).toEqual({
      start: "2026-08-16",
      end: "2026-08-16",
    });
    expect(getAppointmentViewRange("2026-08-16", "week")).toEqual({
      start: "2026-08-10",
      end: "2026-08-16",
    });
    expect(getAppointmentViewRange("2026-08-16", "month")).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
    });
  });

  it("labels each view through the catalogue, weekday included", () => {
    expect(formatAppointmentDateLabel("2026-08-16", "day", t)).toBe(
      "dayLabel(date=16/08/2026,weekday=weekday.long.0)",
    );
    // The week range is two numeric dates and a dash — no words to translate.
    expect(formatAppointmentDateLabel("2026-08-16", "week", t)).toBe(
      "10/08 - 16/08/2026",
    );
    expect(formatAppointmentDateLabel("2026-08-16", "month", t)).toBe(
      "monthLabel(month=8,year=2026)",
    );
  });
});
