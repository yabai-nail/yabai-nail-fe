import type { AdminAccount } from "@/service";
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
