import type { AdminNailDesign } from "@/service";
import { matchesSearch } from "@/lib/admin-search";

export type DesignRow = {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly version: number;
};

export function adaptDesign(design: AdminNailDesign): DesignRow {
  return {
    id: design.id,
    title: design.title,
    status: design.status,
    version: design.version,
  };
}

export const designFixtures: ReadonlyArray<DesignRow> = [
  { id: "nd1", title: "Gradient hồng pastel", status: "PUBLISHED", version: 1 },
  { id: "nd2", title: "Mèo mắt xanh", status: "PUBLISHED", version: 2 },
  { id: "nd3", title: "French classic", status: "DRAFT", version: 1 },
  { id: "nd4", title: "Đính đá Swarovski", status: "ARCHIVED", version: 3 },
];

export function designStatuses(rows: ReadonlyArray<DesignRow>): ReadonlyArray<string> {
  return Array.from(new Set(rows.map((row) => row.status))).sort();
}

export function filterDesigns(
  rows: ReadonlyArray<DesignRow>,
  status: string,
  query: string,
): ReadonlyArray<DesignRow> {
  return rows.filter(
    (row) => (status === "all" || row.status === status) && matchesSearch(query, [row.title]),
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
