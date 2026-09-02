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

/** The translator is a parameter: this is called from render, not from a hook. */
export function membershipTierLabel(
  tier: string,
  t: ((key: string) => string) & { has: (key: string) => boolean },
): string {
  const code = tier.toUpperCase();
  return t.has(`tier.${code}`) ? t(`tier.${code}`) : tier;
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

/**
 * The status label comes from the shared appointment-status catalogue, so the check-in
 * panel and the appointments screen name the same state the same way.
 */
export function summarizeCheckIn(
  resolution: AdminCheckInResolution,
  statusLabel: (status: string) => string,
): CheckInResolutionView {
  return {
    customer: summarizeResolvedCustomer(resolution.customer),
    localDate: resolution.localDate,
    appointments: (resolution.todaysAppointments ?? []).map((appointment) => ({
      id: appointment.id,
      time: formatSalonClock(appointment.startsAt),
      status: statusLabel(appointment.status),
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
