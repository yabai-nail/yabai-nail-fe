// View-model types for the admin customers screen. The fixture customer list
// and the hard-coded service history that used to live here were removed once
// the screen started reading `GET /api/v1/admin/branches/{branchId}/customers`
// and the nail-history read model — a fake roster rendered in the same style as
// a real one is more dangerous than an explicit error or empty state.

import type { CustomerSegment } from "@/lib/admin-customer";

export type { CustomerSegment } from "@/lib/admin-customer";
export type CustomerRank = "gold" | "silver" | "bronze" | "none";

export type Customer = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  readonly birthday: string;
  readonly handle: string;
  readonly preference: string;
  readonly lastVisit: string;
  readonly totalSpend: number;
  readonly points: number;
  readonly visits: number;
  readonly segment: CustomerSegment;
  readonly rank: CustomerRank;
  readonly note: string;
  // Server row identity, used for the `If-Match` precondition on edit. Absent
  // rows keep the mutation buttons disabled.
  readonly version?: number;
  readonly locale?: string;
  readonly status?: string;
};
