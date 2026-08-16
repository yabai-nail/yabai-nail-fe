import { describe, expect, it } from "vitest";
import {
  formatAppointmentDateLabel,
  getAppointmentViewRange,
  shiftAppointmentDate,
} from "./date-utils";

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

  it("formats the visible date label in Vietnamese", () => {
    expect(formatAppointmentDateLabel("2026-08-16", "day")).toBe(
      "16/08/2026 (Chủ Nhật)",
    );
    expect(formatAppointmentDateLabel("2026-08-16", "week")).toBe(
      "10/08 - 16/08/2026",
    );
    expect(formatAppointmentDateLabel("2026-08-16", "month")).toBe(
      "Tháng 8/2026",
    );
  });
});
