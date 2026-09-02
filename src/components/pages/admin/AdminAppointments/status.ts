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
