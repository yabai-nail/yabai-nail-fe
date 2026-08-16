import type { AppointmentStatus } from "./data";

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  cancelled: "Đã hủy",
};

export const appointmentStatusColor = {
  confirmed: "accent",
  pending: "warning",
  cancelled: "default",
} as const satisfies Record<AppointmentStatus, "accent" | "warning" | "default">;
