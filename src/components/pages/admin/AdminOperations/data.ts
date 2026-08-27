export { formatMoney } from "@/lib/admin-format";
import { SALON_TIME_ZONE } from "@/lib/salon-date";
import type {
  AdminCheckInResolution,
  AdminCustomer,
  AdminMembershipCardResolution,
  AdminResolvedCustomer,
} from "@/service";

export type CustomerHit = {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
};

/** Strips grouping characters so "1.000.000" or "1,000,000" become the integer amount. */
export function parseMoney(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function summarizeCustomer(customer: AdminCustomer): CustomerHit {
  const record = customer as unknown as Record<string, unknown>;
  const name = typeof record.displayName === "string" ? record.displayName : "—";
  const phone =
    typeof record.phoneMasked === "string"
      ? record.phoneMasked
      : typeof record.phone === "string"
        ? record.phone
        : "—";
  return { id: customer.id, name, phone };
}

/** Customer identified by a check-in / membership-card lookup, ready to render. */
export type ResolvedCustomer = {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly tier: string;
  readonly points: number;
};

export type ResolvedAppointment = {
  readonly id: string;
  readonly time: string;
  readonly status: string;
  readonly total: number;
};

export type CheckInResolutionView = {
  readonly customer: ResolvedCustomer;
  readonly localDate: string;
  readonly appointments: ReadonlyArray<ResolvedAppointment>;
};

export type MembershipResolutionView = {
  readonly customer: ResolvedCustomer;
  readonly resolvedAt: string;
};

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã đến",
  IN_SERVICE: "Đang làm",
  AWAITING_PAYMENT: "Chờ thanh toán",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
  CANCELLED_BY_CUSTOMER: "Khách đã huỷ",
  CANCELLED_BY_SALON: "Salon đã huỷ",
  NO_SHOW: "Không đến",
};

export function appointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status.toUpperCase()] ?? status;
}

export function membershipTierLabel(tier: string): string {
  return { MEMBER: "Thành viên", SILVER: "Bạc", GOLD: "Vàng", PLATINUM: "Bạch kim" }[tier.toUpperCase()] ?? tier;
}

/**
 * The salon's wall clock, not the browser's: an admin abroad must still read
 * the hour the customer will actually walk in at.
 */
export function formatSalonClock(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: SALON_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at);
}

export function summarizeResolvedCustomer(customer: AdminResolvedCustomer): ResolvedCustomer {
  return {
    id: customer.id,
    name: typeof customer.displayName === "string" && customer.displayName ? customer.displayName : "—",
    phone: typeof customer.phone === "string" && customer.phone ? customer.phone : "—",
    tier: typeof customer.tier === "string" && customer.tier ? customer.tier : "—",
    points: typeof customer.pointBalance === "number" ? customer.pointBalance : 0,
  };
}

export function summarizeCheckIn(resolution: AdminCheckInResolution): CheckInResolutionView {
  return {
    customer: summarizeResolvedCustomer(resolution.customer),
    localDate: resolution.localDate,
    appointments: (resolution.todaysAppointments ?? []).map((appointment) => ({
      id: appointment.id,
      time: formatSalonClock(appointment.startsAt),
      status: appointmentStatusLabel(appointment.status),
      total: appointment.total,
    })),
  };
}

export function summarizeMembership(
  resolution: AdminMembershipCardResolution,
): MembershipResolutionView {
  return {
    customer: summarizeResolvedCustomer(resolution.customer),
    resolvedAt: resolution.resolvedAt,
  };
}
