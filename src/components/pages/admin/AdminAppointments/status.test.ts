import { describe, expect, it } from "vitest";

import { appointmentStatusLabel, normalizeAppointmentStatus } from "./status";

describe("appointment status mapping", () => {
  // The bug: substring tests folded these three into "confirmed", so a finished
  // appointment showed on the calendar as still upcoming.
  it.each([
    ["COMPLETED", "completed", "Hoàn tất"],
    ["IN_SERVICE", "in_service", "Đang làm"],
    ["NO_SHOW", "no_show", "Không đến"],
    ["CHECKED_IN", "checked_in", "Đã đến"],
    ["AWAITING_PAYMENT", "awaiting_payment", "Chờ thanh toán"],
    ["CONFIRMED", "confirmed", "Đã xác nhận"],
  ])("maps %s to its own display status, not to confirmed", (server, display, label) => {
    expect(normalizeAppointmentStatus(server)).toBe(display);
    expect(appointmentStatusLabel[normalizeAppointmentStatus(server)]).toBe(label);
  });

  it("still recognises every cancellation variant the API can send", () => {
    expect(normalizeAppointmentStatus("CANCELLED_BY_SALON")).toBe("cancelled");
    expect(normalizeAppointmentStatus("CANCELLED_BY_CUSTOMER")).toBe("cancelled");
  });

  it("falls back to pending for a status it has never seen", () => {
    expect(normalizeAppointmentStatus("SOMETHING_NEW")).toBe("pending");
  });
});
