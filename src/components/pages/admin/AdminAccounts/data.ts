import type { AdminAccount } from "@/service";

export type AccountRow = {
  readonly id: string;
  readonly phone: string;
  readonly displayName: string;
  readonly role: string;
  readonly status: string;
  readonly branchIds?: ReadonlyArray<string>;
  readonly version: number;
};

export const roleLabels: Record<string, string> = {
  OWNER: "Chủ tiệm",
  MANAGER: "Quản lý",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng",
};

export const accountStatusLabels: Record<string, string> = {
  ACTIVE: "Hoạt động",
  SUSPENDED: "Tạm khoá",
  DISABLED: "Vô hiệu",
};

export function adaptAccount(account: AdminAccount): AccountRow {
  return {
    id: account.id,
    phone: account.phone,
    displayName: account.displayName,
    role: account.role,
    status: account.status,
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
  const normalized = query.trim().toLocaleLowerCase("vi");
  return rows.filter(
    (row) =>
      (role === "all" || row.role === role) &&
      (!normalized ||
        [row.displayName, row.phone].some((field) =>
          field.toLocaleLowerCase("vi").includes(normalized),
        )),
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
