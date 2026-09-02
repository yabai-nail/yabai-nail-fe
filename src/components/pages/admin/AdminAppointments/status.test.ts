import { describe, expect, it } from "vitest";

import type { AppointmentLifecycleAction } from "./data";
import {
  appointmentStatusLabel,
  appointmentStatusTone,
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

describe("appointmentStatusTone", () => {
  // "border-l-admin-warning" and "bg-admin-warning/10" both name admin-warning.
  const tokenOf = (className: string) =>
    className.replace(/^(border-l-|bg-)/, "").replace(/\/\d+$/, "");

  const STATUSES = Object.keys(appointmentStatusLabel) as ReadonlyArray<
    keyof typeof appointmentStatusLabel
  >;

  it("covers every status the calendar can render", () => {
    // A missing entry renders a pill with no left border and no tint, which
    // reads as "some status we don't have a colour for" rather than as itself.
    expect(Object.keys(appointmentStatusTone).toSorted()).toEqual(
      [...STATUSES].toSorted(),
    );
  });

  it.each(STATUSES)("dresses %s's bar, tint and dot from one token", (status) => {
    const { bar, tint, dot } = appointmentStatusTone[status];
    // Catches the copy-paste where a bar says warning and its dot says success:
    // the pill would then carry two different colours for one status.
    expect([tokenOf(tint), tokenOf(dot)]).toEqual([tokenOf(bar), tokenOf(bar)]);
  });

  it("shares a colour only between statuses that mean the same thing", () => {
    const byToken = new Map<string, string[]>();
    for (const status of STATUSES) {
      const token = tokenOf(appointmentStatusTone[status].bar);
      byToken.set(token, [...(byToken.get(token) ?? []), status]);
    }
    const shared = [...byToken.values()]
      .filter((group) => group.length > 1)
      .map((group) => group.toSorted())
      .toSorted((left, right) => left[0].localeCompare(right[0]));

    // Only two pairs may share: both are "waiting on the salon" and both are
    // "the visit never happened". Any third pair means we ran out of colours
    // somewhere and quietly made two different states look alike.
    expect(shared).toEqual([
      ["awaiting_payment", "pending"],
      ["cancelled", "no_show"],
    ]);
  });

  it("keeps the CVD-unsafe danger token off the calendar", () => {
    // #d1113f sits ΔE 3.9 from the accent pink at #d8145b — the palette
    // validator rates that as the same colour, for every kind of vision.
    const tokens = STATUSES.map((status) =>
      tokenOf(appointmentStatusTone[status].bar),
    );
    expect(tokens).not.toContain("admin-danger");
  });
});
