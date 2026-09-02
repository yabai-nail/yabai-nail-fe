import type { AppointmentStatus } from "../AdminAppointments/data";
// View-model types for the admin dashboard. The fixture values that used to
// live here were removed once every panel started reading the branch dashboard,
// the revenue report and the staff-performance report — a fake number rendered
// in the same style as a real one is worse than an explicit "chưa có dữ liệu".

export type MetricIcon = "calendar" | "revenue" | "customers" | "staff";
export type MetricTone = "accent" | "success" | "info" | "violet";

export type DashboardMetric = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly detail: string;
  readonly trend?: string;
  readonly trendDirection?: "up" | "down";
  readonly icon: MetricIcon;
  readonly tone: MetricTone;
};

export type Appointment = {
  readonly id: string;
  readonly time: string;
  readonly customer: string;
  readonly service: string;
  // Any lifecycle label the shared status map can produce, not the two this
  // panel used to collapse everything into.
  readonly status: AppointmentStatus;
};

export type StaffMember = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  /** A code, not a label. It used to hold the Vietnamese words, and StaffPanel
   *  compared against them -- so translating the words broke the comparison. */
  readonly status: "working" | "off";
  readonly revenue: string;
  readonly payout: string;
};
