import type { AppointmentLifecycleAction, AppointmentStatus } from "./data";

/**
 * One API status to one display status. The previous mapping used substring
 * tests and folded COMPLETED, IN_SERVICE and NO_SHOW into "confirmed", so a
 * finished or missed appointment read as still upcoming on the calendar and the
 * day summary counted it under "Đã xác nhận".
 */
const DISPLAY_STATUS_BY_SERVER: Record<string, AppointmentStatus> = {
  PENDING: "pending",
  PENDING_CONFIRMATION: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  IN_SERVICE: "in_service",
  AWAITING_PAYMENT: "awaiting_payment",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
};

export function normalizeAppointmentStatus(status: string): AppointmentStatus {
  const upper = status.toUpperCase();
  const mapped = DISPLAY_STATUS_BY_SERVER[upper];
  if (mapped) return mapped;
  // CANCELLED_BY_SALON / CANCELLED_BY_CUSTOMER and any future cancel variant.
  if (upper.includes("CANCEL")) return "cancelled";
  return "pending";
}

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  cancelled: "Đã hủy",
  checked_in: "Đã đến",
  in_service: "Đang làm",
  awaiting_payment: "Chờ thanh toán",
  completed: "Hoàn tất",
  no_show: "Không đến",
};

export const appointmentStatusColor = {
  confirmed: "accent",
  pending: "warning",
  cancelled: "default",
  checked_in: "accent",
  in_service: "accent",
  awaiting_payment: "warning",
  completed: "success",
  no_show: "default",
} as const satisfies Record<AppointmentStatus, "accent" | "warning" | "default" | "success">;

/**
 * "no-show" ends the appointment early; every other transition advances it one
 * step along a normal visit. The two carry very different consequences, so the
 * panel gives them different weight instead of two equal buttons side by side.
 */
const LIFECYCLE_EXCEPTIONS: ReadonlySet<AppointmentLifecycleAction> = new Set([
  "no-show",
]);

export function splitLifecycleActions(
  actions: ReadonlyArray<AppointmentLifecycleAction>,
) {
  return {
    steps: actions.filter((action) => !LIFECYCLE_EXCEPTIONS.has(action)),
    exceptions: actions.filter((action) => LIFECYCLE_EXCEPTIONS.has(action)),
  };
}

/**
 * How a calendar pill wears its status: a 4px left bar to scan by, the same
 * colour at 10% behind the pill, and a dot beside the written label.
 *
 * Five live colours and a grey, all from the admin tokens. Two pairs share a
 * colour on purpose — "pending"/"awaiting_payment" both mean the salon owes
 * someone an action, "cancelled"/"no_show" both mean the visit never happened —
 * and their labels tell them apart.
 *
 * `admin-danger` is deliberately absent. Against the accent pink it measures
 * ΔE 3.9 for normal vision and 3.4 for deutan, which the palette validator
 * rates as one colour, not two.
 *
 * Colour never travels alone here: the pill always prints the status label, in
 * the week view too. Green and pink sit ΔE 4.7 apart for a deutan reader, so
 * the label is what carries the meaning and the colour only speeds up the scan.
 */
export const appointmentStatusTone = {
  pending: { bar: "border-l-admin-warning", tint: "bg-admin-warning/10", dot: "bg-admin-warning" },
  confirmed: { bar: "border-l-admin-info", tint: "bg-admin-info/10", dot: "bg-admin-info" },
  checked_in: { bar: "border-l-admin-violet", tint: "bg-admin-violet/10", dot: "bg-admin-violet" },
  in_service: { bar: "border-l-admin-accent", tint: "bg-admin-accent/10", dot: "bg-admin-accent" },
  awaiting_payment: { bar: "border-l-admin-warning", tint: "bg-admin-warning/10", dot: "bg-admin-warning" },
  completed: { bar: "border-l-admin-success", tint: "bg-admin-success/10", dot: "bg-admin-success" },
  cancelled: { bar: "border-l-admin-muted", tint: "bg-admin-muted/10", dot: "bg-admin-muted" },
  no_show: { bar: "border-l-admin-muted", tint: "bg-admin-muted/10", dot: "bg-admin-muted" },
} as const satisfies Record<
  AppointmentStatus,
  { readonly bar: string; readonly tint: string; readonly dot: string }
>;
