import { describe, expect, it } from "vitest";
import type { Appointment, AppointmentDraft } from "./data";
import {
  cancelAppointment,
  createAppointment,
  filterAppointments,
  getAppointmentSummary,
  getAppointmentsInRange,
  hasAppointmentConflict,
  updateAppointment,
  validateAppointmentDraft,
} from "./appointment-state";

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

const customer = {
  id: "customer-1",
  name: "Nguyễn Thu Hương",
  initials: "NH",
  phone: "0901 234 567",
  birthday: "25/06/1996",
  segment: "loyal" as const,
  preference: "Thích tone hồng.",
  visits: 42,
  totalSpend: 18_560_000,
};

const service = { id: "service-1", name: "Sơn gel đơn sắc", durationMinutes: 90 };
const maiLinh = { id: "staff-1", name: "Mai Linh", initials: "ML" };
const thaoVy = { id: "staff-2", name: "Thảo Vy", initials: "TV" };

const appointments: ReadonlyArray<Appointment> = [
  {
    id: "appointment-2",
    date: "2026-08-16",
    startTime: "12:00",
    endTime: "13:30",
    customer,
    service,
    staff: thaoVy,
    status: "pending",
    note: "",
  },
  {
    id: "appointment-1",
    date: "2026-08-16",
    startTime: "10:00",
    endTime: "11:30",
    customer,
    service,
    staff: maiLinh,
    status: "confirmed",
    note: "Khách đến đúng giờ.",
  },
  {
    id: "appointment-3",
    date: "2026-08-17",
    startTime: "09:00",
    endTime: "10:30",
    customer,
    service,
    staff: maiLinh,
    status: "cancelled",
    note: "",
  },
];

const createDraft = (overrides: Partial<AppointmentDraft> = {}): AppointmentDraft => ({
  date: "2026-08-16",
  startTime: "14:00",
  endTime: "15:30",
  customer,
  service,
  staff: maiLinh,
  status: "confirmed",
  note: "",
  ...overrides,
});

describe("appointment selectors", () => {
  it("filters by date and status then sorts by start time without mutating input", () => {
    const original = [...appointments];

    const result = filterAppointments(appointments, {
      date: "2026-08-16",
      status: "all",
    });

    expect(result.map((appointment) => appointment.id)).toEqual([
      "appointment-1",
      "appointment-2",
    ]);
    expect(appointments).toEqual(original);
  });

  it("returns appointments inside an inclusive date range", () => {
    const result = getAppointmentsInRange(
      appointments,
      "2026-08-16",
      "2026-08-16",
    );

    expect(result.map((appointment) => appointment.id)).toEqual([
      "appointment-1",
      "appointment-2",
    ]);
  });

  it("derives status counts from the selected collection", () => {
    expect(getAppointmentSummary(appointments)).toEqual({
      total: 3,
      confirmed: 1,
      pending: 1,
      cancelled: 1,
      // Every lifecycle state is seeded, so a status the fixtures do not use
      // still counts as 0 rather than making its tile render NaN.
      checked_in: 0,
      in_service: 0,
      awaiting_payment: 0,
      completed: 0,
      no_show: 0,
    });
  });

  it("counts a finished appointment as completed, not as confirmed", () => {
    const summary = getAppointmentSummary([
      { ...appointments[0], id: "done", status: "completed" },
    ]);
    expect(summary.completed).toBe(1);
    expect(summary.confirmed).toBe(0);
  });
});

describe("appointment validation", () => {
  it("rejects an end time that is not after the start time", () => {
    expect(
      validateAppointmentDraft(
        createDraft({ startTime: "14:00", endTime: "14:00" }),
        t,
      ),
    ).toEqual({ endTime: "validation.endAfterStart" });
  });

  it("detects overlap for the same active staff member", () => {
    expect(
      hasAppointmentConflict(
        appointments,
        createDraft({ startTime: "10:30", endTime: "11:45" }),
      ),
    ).toBe(true);
  });

  it("allows adjacent time slots and overlapping slots for another staff member", () => {
    expect(
      hasAppointmentConflict(
        appointments,
        createDraft({ startTime: "11:30", endTime: "12:30" }),
      ),
    ).toBe(false);
    expect(
      hasAppointmentConflict(
        appointments,
        createDraft({
          startTime: "10:30",
          endTime: "11:45",
          staff: thaoVy,
        }),
      ),
    ).toBe(false);
  });

  it("ignores the record being edited and cancelled appointments", () => {
    expect(
      hasAppointmentConflict(
        appointments,
        createDraft({ startTime: "10:00", endTime: "11:30" }),
        "appointment-1",
      ),
    ).toBe(false);
    expect(
      hasAppointmentConflict(
        appointments,
        createDraft({
          date: "2026-08-17",
          startTime: "09:15",
          endTime: "10:00",
        }),
      ),
    ).toBe(false);
  });
});

describe("appointment local mutations", () => {
  it("creates a new record without mutating the source collection", () => {
    const result = createAppointment(appointments, createDraft(), "appointment-local-1");

    expect(result).toHaveLength(4);
    expect(result.at(-1)).toMatchObject({
      id: "appointment-local-1",
      startTime: "14:00",
    });
    expect(appointments).toHaveLength(3);
  });

  it("updates a record while preserving its stable id", () => {
    const result = updateAppointment(
      appointments,
      "appointment-1",
      createDraft({ startTime: "15:00", endTime: "16:30" }),
    );

    expect(result.find((item) => item.id === "appointment-1")).toMatchObject({
      id: "appointment-1",
      startTime: "15:00",
      endTime: "16:30",
    });
    expect(appointments[1].startTime).toBe("10:00");
  });

  it("cancels a record without deleting it", () => {
    const result = cancelAppointment(appointments, "appointment-1");

    expect(result).toHaveLength(appointments.length);
    expect(result.find((item) => item.id === "appointment-1")?.status).toBe(
      "cancelled",
    );
  });
});
