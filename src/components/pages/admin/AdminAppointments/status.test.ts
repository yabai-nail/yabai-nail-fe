import { describe, expect, it } from "vitest";

import type { AppointmentLifecycleAction } from "./data";
import {
  appointmentStatusLabel,
  normalizeAppointmentStatus,
  splitLifecycleActions,
} from "./status";

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

describe("splitLifecycleActions", () => {
  // The three sets the BE actually sends today, keyed by the status that
  // produces them (see LIFECYCLE_BY_STATUS in component.tsx).
  const REAL_SETS: ReadonlyArray<ReadonlyArray<AppointmentLifecycleAction>> = [
    ["check-in", "no-show"],
    ["service-start", "no-show"],
    ["service-complete"],
  ];

  const EVERY_ACTION: ReadonlyArray<AppointmentLifecycleAction> = [
    "check-in",
    "service-start",
    "service-complete",
    "no-show",
  ];

  it.each(REAL_SETS)("puts %s into exactly one group, losing nothing", (...actions) => {
    const { steps, exceptions } = splitLifecycleActions(actions);
    // Every action lands somewhere, and nowhere twice: a dropped action hides a
    // transition the admin needs, a duplicated one renders the same button twice.
    expect([...steps, ...exceptions].toSorted()).toEqual([...actions].toSorted());
  });

  it("keeps the order the backend sent within each group", () => {
    const { steps } = splitLifecycleActions([
      "service-complete",
      "check-in",
      "no-show",
      "service-start",
    ]);
    expect(steps).toEqual(["service-complete", "check-in", "service-start"]);
  });

  it("treats no-show as the only exception, every other action as a step", () => {
    const { steps, exceptions } = splitLifecycleActions(EVERY_ACTION);
    expect(exceptions).toEqual(["no-show"]);
    expect(steps).toEqual(["check-in", "service-start", "service-complete"]);
  });

  it("returns two empty groups for a terminal status", () => {
    expect(splitLifecycleActions([])).toEqual({ steps: [], exceptions: [] });
  });
});