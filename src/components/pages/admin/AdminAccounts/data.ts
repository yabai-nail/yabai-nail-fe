import type { AdminAccount, AdminStaffMember } from "@/service";
import { matchesSearch } from "@/lib/admin-search";

export type AccountRow = {
  readonly id: string;
  readonly phone: string;
  readonly displayName: string;
  readonly role: string;
  readonly status: string;
  readonly branchIds?: ReadonlyArray<string>;
  readonly version: number;
};

export function adaptAccount(account: AdminAccount): AccountRow {
  return {
    id: account.id,
    phone: account.phone,
    displayName: account.displayName,
    role: account.role,
    status: account.accountStatus,
    branchIds: account.branchIds,
    version: account.version,
  };
}

export const accountFixtures: ReadonlyArray<AccountRow> = [
  { id: "ac1", phone: "0900000003", displayName: "Chủ tiệm", role: "OWNER", status: "ACTIVE", version: 1 },
  { id: "ac2", phone: "0900000002", displayName: "Thảo (Quản lý)", role: "MANAGER", status: "ACTIVE", version: 2 },
  { id: "ac3", phone: "0900000010", displayName: "Yuki", role: "STAFF", status: "ACTIVE", version: 1 },
  { id: "ac4", phone: "0900000011", displayName: "Mai", role: "STAFF", status: "SUSPENDED", version: 3 },
];

export function accountRoles(rows: ReadonlyArray<AccountRow>): ReadonlyArray<string> {
  return Array.from(new Set(rows.map((row) => row.role))).sort();
}

export function filterAccounts(
  rows: ReadonlyArray<AccountRow>,
  role: string,
  query: string,
): ReadonlyArray<AccountRow> {
  return rows.filter(
    (row) =>
      (role === "all" || row.role === role) &&
      matchesSearch(query, [row.displayName, row.phone]),
  );
}

export function paginate<T>(
  items: ReadonlyArray<T>,
  requestedPage: number,
  pageSize: number,
) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new RangeError("Page size must be a positive integer.");
  }
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageCount,
  } as const;
}

// -- Staff profile links ------------------------------------------------------------------

/** The roster profile each login is linked to. A login without one cannot sign in as STAFF. */
export function staffByAccount(staff: ReadonlyArray<AdminStaffMember>): ReadonlyMap<string, AdminStaffMember> {
  const index = new Map<string, AdminStaffMember>();
  for (const member of staff) {
    const accountId = member.accountId ?? member.account?.id ?? null;
    if (accountId && !index.has(accountId)) index.set(accountId, member);
  }
  return index;
}

/** Profiles that no login points at yet: the only ones a login can be linked to. */
export function unlinkedStaff(staff: ReadonlyArray<AdminStaffMember>): ReadonlyArray<AdminStaffMember> {
  return staff.filter((member) => !(member.accountId ?? member.account?.id));
}

// -- Capabilities -----------------------------------------------------------------------------

/**
 * The console area a permission code belongs to, by its first segments. The screen shows a
 * role as the areas it may touch rather than as raw codes; anything unknown keeps its code.
 */
const AREA_OF_PREFIX: ReadonlyArray<readonly [string, string]> = [
  ["sales.report", "salesReports"],
  ["payroll", "payroll"],
  ["appointment", "appointments"],
  ["calendar", "appointments"],
  ["customer", "customers"],
  ["catalog", "catalog"],
  ["staff", "staff"],
  ["report", "reports"],
  ["review", "reviews"],
  ["design", "designs"],
  ["promotion", "marketing"],
  ["campaign", "marketing"],
  ["account", "accounts"],
  ["branch", "branches"],
  ["message", "messages"],
  ["payment", "payments"],
  ["refund", "payments"],
  ["loyalty", "config"],
  ["system", "config"],
  ["audit", "audit"],
  ["profile", "profile"],
];

export function capabilityAreas(permissions: ReadonlyArray<string>): ReadonlyArray<string> {
  const areas = new Set<string>();
  for (const code of permissions) {
    const match = AREA_OF_PREFIX.find(([prefix]) => code === prefix || code.startsWith(`${prefix}.`));
    areas.add(match ? match[1] : code);
  }
  return Array.from(areas);
}
