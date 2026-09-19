import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { layoutDayAppointments } from "./calendar-layout";

type Interval = Readonly<{
  id: string;
  startTime: string;
  endTime: string;
}>;

function interval(id: string, startTime: string, endTime: string): Interval {
  return { id, startTime, endTime };
}

describe("day calendar layout", () => {
  it("renders the day view from calculated time spans instead of start-hour buckets", () => {
    const source = readFileSync(new URL("./AppointmentCalendar.tsx", import.meta.url), "utf8");

    expect(source).toContain("layoutDayAppointments(appointments)");
    expect(source).toContain("layout.visibleDurationMinutes");
    expect(source).not.toContain("Number(appointment.startTime.slice(0, 2)) === hour");
  });

  it("anchors appointment details to the start of a Teams-style time block", () => {
    const source = readFileSync(new URL("./AppointmentCalendar.tsx", import.meta.url), "utf8");

    expect(source).toContain("items-start");
  });

  it("spans an appointment across its complete duration", () => {
    const [layout] = layoutDayAppointments([interval("long", "13:00", "15:30")]);

    expect(layout).toMatchObject({
      appointment: { id: "long" },
      offsetMinutes: 4 * 60,
      visibleDurationMinutes: 150,
      lane: 0,
      laneCount: 1,
    });
  });

  it("positions arbitrary minutes and clips appointments to the visible day", () => {
    const layouts = layoutDayAppointments([
      interval("before", "08:30", "09:30"),
      interval("minute-offset", "13:15", "14:45"),
      interval("after", "20:30", "21:30"),
      interval("hidden-before", "07:00", "08:00"),
      interval("hidden-after", "21:00", "22:00"),
      interval("invalid", "15:00", "14:00"),
    ]);

    expect(
      layouts.map(({ appointment, offsetMinutes, visibleDurationMinutes }) => ({
        id: appointment.id,
        offsetMinutes,
        visibleDurationMinutes,
      })),
    ).toEqual([
      { id: "before", offsetMinutes: 0, visibleDurationMinutes: 30 },
      { id: "minute-offset", offsetMinutes: 255, visibleDurationMinutes: 90 },
      { id: "after", offsetMinutes: 690, visibleDurationMinutes: 30 },
    ]);
  });

  it("shares lanes for adjacent bookings and splits genuinely overlapping bookings", () => {
    const layouts = layoutDayAppointments([
      interval("long", "13:00", "15:30"),
      interval("overlap-a", "13:30", "14:00"),
      interval("overlap-b", "14:00", "15:00"),
      interval("adjacent", "15:30", "16:00"),
    ]);
    const byId = Object.fromEntries(layouts.map((layout) => [layout.appointment.id, layout]));

    expect(byId.long).toMatchObject({ lane: 0, laneCount: 2 });
    expect(byId["overlap-a"]).toMatchObject({ lane: 1, laneCount: 2 });
    expect(byId["overlap-b"]).toMatchObject({ lane: 1, laneCount: 2 });
    expect(byId.adjacent).toMatchObject({ lane: 0, laneCount: 1 });
  });

  it("allocates enough lanes for simultaneous bookings", () => {
    const layouts = layoutDayAppointments([
      interval("first", "10:00", "12:00"),
      interval("second", "10:00", "11:00"),
      interval("third", "10:30", "11:30"),
    ]);

    expect(layouts).toHaveLength(3);
    expect(layouts.map(({ laneCount }) => laneCount)).toEqual([3, 3, 3]);
    expect(new Set(layouts.map(({ lane }) => lane))).toEqual(new Set([0, 1, 2]));
  });
});
