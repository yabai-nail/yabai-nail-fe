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
