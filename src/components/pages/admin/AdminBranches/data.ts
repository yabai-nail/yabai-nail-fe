import type { AdminBranch } from "@/service";
import { matchesSearch } from "@/lib/admin-search";

export type BranchRow = {
  readonly id: string;
  readonly name: string;
  readonly address?: string;
  readonly status?: string;
  readonly timezone?: string;
  readonly version: number;
};

/**
 * Backend trả cờ boolean `active`; bảng hiển thị dùng mã trạng thái dạng chuỗi.
 * Thiếu cờ (undefined) thì trả undefined để ô hiển thị "—" thay vì đoán bừa.
 */
export function branchStatusFromActive(active: boolean | undefined): string | undefined {
  if (active === undefined) return undefined;
  return active ? "ACTIVE" : "INACTIVE";
}

export function adaptBranch(branch: AdminBranch): BranchRow {
  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    status: branchStatusFromActive(branch.active),
    timezone: branch.timezone,
    version: branch.version,
  };
}

export const branchFixtures: ReadonlyArray<BranchRow> = [
  { id: "br1", name: "YABAI NAIL Thảo Điền", address: "12 Xuân Thủy, Thủ Đức, TP.HCM", status: "ACTIVE", timezone: "Asia/Ho_Chi_Minh", version: 1 },
  { id: "br2", name: "YABAI NAIL Quận 1", address: "45 Lê Lợi, Quận 1, TP.HCM", status: "ACTIVE", timezone: "Asia/Ho_Chi_Minh", version: 2 },
  { id: "br3", name: "YABAI NAIL Hà Nội", address: "88 Bà Triệu, Hoàn Kiếm, Hà Nội", status: "INACTIVE", timezone: "Asia/Ho_Chi_Minh", version: 1 },
];

export function filterBranches(
  rows: ReadonlyArray<BranchRow>,
  query: string,
): ReadonlyArray<BranchRow> {
  return rows.filter((row) => matchesSearch(query, [row.name, row.address]));
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
