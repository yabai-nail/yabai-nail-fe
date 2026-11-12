import { isAdminPhone, isStrongTemporaryPassword } from "@/lib/admin-credentials";
import { matchesSearch } from "@/lib/admin-search";
import type { AdminTableSort } from "@/lib/admin-table-sort";

export type StaffStatus = "working" | "leave";

/**
 * A staff row as this screen renders it: the roster record from
 * `GET /api/v1/admin/staff` joined with that member's row in the branch
 * staff-performance read model for the selected period.
 *
 * The money fields are nullable on purpose. The performance read model has no
 * row for a member who did nothing in the period, and it may omit a field the
 * branch has not configured; rendering `¥0` or `0%` there would state a fact
 * the backend never sent.
 */
export type StaffMember = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  /** Public URL of the profile photo, or null when none is set. */
  readonly avatarUrl: string | null;
  readonly status: StaffStatus;
  readonly revenue: number | null;
  readonly refundTotal: number | null;
  readonly commissionRate: number | null;
  readonly commissionAmount: number | null;
  readonly orders: number | null;
  readonly version: number;
  readonly branchId: string;
  /**
   * Resolved from the admin branch list; `null` when that list has not arrived or
   * does not name this branch, so the table shows a dash instead of a guess.
   */
  readonly branchName: string | null;
};

/** The code the backend rejects a transfer with while the member still has work booked. */
export const OPEN_APPOINTMENTS_CODE = "RESOURCE_HAS_OPEN_APPOINTMENTS";

/** The API's refusal to hard-delete a technician who has appointments, commissions or payroll. */
export const STAFF_HAS_HISTORY_CODE = "STAFF_HAS_HISTORY";

/**
 * The delete refusals the dialog answers itself: history means "deactivate instead", open
 * appointments means "reassign them first". Anything else shows the API's own message.
 */
export function staffDeleteRefusal(error: unknown): "hasHistory" | "openAppointments" | null {
  return errorCode(error) === STAFF_HAS_HISTORY_CODE ? "hasHistory" : staffSaveErrorKey(error);
}

/** The API error code carried by a thrown value, if it carries one. */
function errorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error ? (error as { readonly code?: unknown }).code : null;
}

/**
 * The one save failure this form explains in its own words.
 *
 * Everything else keeps showing `error.message`, which the backend writes in Vietnamese. This
 * case does not: its message comes back unaccented ("Khong the ngung hoac chuyen nhan vien
 * khi con lich hen chua hoan tat."), and it is also the only failure the admin can act on —
 * finish or cancel those appointments, then move the technician.
 */
export function staffSaveErrorKey(error: unknown): "openAppointments" | null {
  return errorCode(error) === OPEN_APPOINTMENTS_CODE ? "openAppointments" : null;
}

/**
 * Whether the create form is worth submitting yet.
 *
 * The account half is validated here rather than left to the server because the form sends
 * two requests: a 422 on the password would arrive after the account call, with the roster
 * record still missing and nothing on screen saying which of the two failed.
 */
export function canCreateStaff(draft: {
  readonly name: string;
  readonly withAccount: boolean;
  readonly phone: string;
  readonly password: string;
}): boolean {
  if (draft.name.trim().length < 2) return false;
  if (!draft.withAccount) return true;
  return isAdminPhone(draft.phone) && isStrongTemporaryPassword(draft.password);
}

/** The staff table's free-text search: the name or the phone, the two things an admin knows. */
export function searchStaff(members: ReadonlyArray<StaffMember>, query: string): ReadonlyArray<StaffMember> {
  return members.filter((member) => matchesSearch(query, [member.name, member.phone]));
}

/** The staff table's sortable columns. */
export type StaffSortKey = "name" | "revenue" | "commissionRate" | "commissionAmount" | "orders";

/**
 * Orders the roster for the clicked column; null keeps the API's order. A member with no figure
 * for the period has no value rather than zero, so they stay after every member who has one,
 * in either direction. Ties fall back to the name.
 */
export function sortStaff(
  members: ReadonlyArray<StaffMember>,
  sort: AdminTableSort<StaffSortKey> | null,
): ReadonlyArray<StaffMember> {
  if (!sort) return members;
  const sign = sort.direction === "asc" ? 1 : -1;
  const byName = (left: StaffMember, right: StaffMember) => left.name.localeCompare(right.name, "vi");
  return [...members].sort((left, right) => {
    if (sort.key === "name") return sign * byName(left, right);
    const a = left[sort.key], b = right[sort.key];
    if (a === null || b === null) return Number(a === null) - Number(b === null) || byName(left, right);
    return sign * (a - b) || byName(left, right);
  });
}

export { paginate } from "@/lib/admin-pagination";
