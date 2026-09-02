import { describe, expect, it } from "vitest";

import { appointmentStatusLabel, normalizeAppointmentStatus } from "./status";

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


describe("appointment status mapping", () => {
  // The bug: substring tests folded these three into "confirmed", so a finished
  // appointment showed on the calendar as still upcoming.
  it.each([
    ["COMPLETED", "completed"],
    ["IN_SERVICE", "in_service"],
    ["NO_SHOW", "no_show"],
    ["CHECKED_IN", "checked_in"],
    ["AWAITING_PAYMENT", "awaiting_payment"],
    ["CONFIRMED", "confirmed"],
  ])("maps %s to its own display status, not to confirmed", (server, display) => {
    expect(normalizeAppointmentStatus(server)).toBe(display);
    // Round trip: the display status resolves back to the server enum the shared
    // catalogue is keyed by, so every screen names this status the same way.
    expect(appointmentStatusLabel(normalizeAppointmentStatus(server), t)).toBe(server);
  });

  it("still recognises every cancellation variant the API can send", () => {
    expect(normalizeAppointmentStatus("CANCELLED_BY_SALON")).toBe("cancelled");
    expect(normalizeAppointmentStatus("CANCELLED_BY_CUSTOMER")).toBe("cancelled");
    expect(appointmentStatusLabel("cancelled", t)).toBe("CANCELLED");
  });

  it("falls back to pending for a status it has never seen", () => {
    expect(normalizeAppointmentStatus("SOMETHING_NEW")).toBe("pending");
  });
});
