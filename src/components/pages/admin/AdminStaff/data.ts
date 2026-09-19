import { isAdminPhone, isStrongTemporaryPassword } from "@/lib/admin-credentials";

export type StaffStatus = "working" | "leave";

/**
 * A staff row as this screen renders it: the roster record from
 * `GET /api/v1/admin/staff` joined with that member's row in the branch
 * staff-performance read model for the selected period.
 *
 * The money fields are nullable on purpose. The performance read model has no
 * row for a member who did nothing in the period, and it may omit a field the
 * branch has not configured; rendering `0 ¥` or `0%` there would state a fact
 * the backend never sent.
 */
export type StaffMember = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  readonly status: StaffStatus;
  readonly revenue: number | null;
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

/**
 * The one save failure this form explains in its own words.
 *
 * Everything else keeps showing `error.message`, which the backend writes in Vietnamese. This
 * case does not: its message comes back unaccented ("Khong the ngung hoac chuyen nhan vien
 * khi con lich hen chua hoan tat."), and it is also the only failure the admin can act on —
 * finish or cancel those appointments, then move the technician.
 */
export function staffSaveErrorKey(error: unknown): "openAppointments" | null {
  const code = typeof error === "object" && error !== null && "code" in error
    ? (error as { readonly code?: unknown }).code
    : null;
  return code === OPEN_APPOINTMENTS_CODE ? "openAppointments" : null;
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

/** Client-side page slice for the roster list (rows are fetched in one page, paged in memory). */
export function paginate<T>(items: ReadonlyArray<T>, page: number, pageSize: number): { readonly items: ReadonlyArray<T>; readonly page: number; readonly pageCount: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pageCount };
}
