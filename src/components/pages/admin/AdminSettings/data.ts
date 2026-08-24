/**
 * One row of the commission table: the staff roster record joined with that
 * member's row in the branch staff-performance read model for the period.
 *
 * There is no "áp dụng từ ngày" or "tỷ lệ trước đó" here. `effectiveFrom` only
 * exists on `GET /api/v1/admin/staff/{staffId}/compensation`, one request per
 * staff member, and no endpoint returns a history of rate changes at all — so
 * this screen shows neither rather than inventing them.
 */
export type CommissionPolicy = {
  readonly id: string;
  readonly staffId: string;
  readonly name: string;
  readonly initials: string;
  /** From `account.role` on the roster record; absent for a plain staff account. */
  readonly roleLabel: string | null;
  readonly status: "working" | "leave";
  readonly rate: number | null;
  readonly personalRevenue: number | null;
  readonly payout: number | null;
};
