import type { AdminNailDesign } from "@/service";

export type DesignRow = {
  readonly id: string;
  readonly name: string;
  readonly imageUrl?: string;
  readonly status: string;
  readonly version: number;
};

export const designStatusLabels: Record<string, string> = {
  PUBLISHED: "Đã đăng",
  DRAFT: "Nháp",
  ARCHIVED: "Lưu trữ",
  HIDDEN: "Ẩn",
};

export function adaptDesign(design: AdminNailDesign): DesignRow {
  return {
    id: design.id,
    name: design.name,
    imageUrl: design.imageUrl,
    status: design.status,
    version: design.version,
  };
}

export const designFixtures: ReadonlyArray<DesignRow> = [
  { id: "nd1", name: "Gradient hồng pastel", status: "PUBLISHED", version: 1 },
  { id: "nd2", name: "Mèo mắt xanh", status: "PUBLISHED", version: 2 },
  { id: "nd3", name: "French classic", status: "DRAFT", version: 1 },
  { id: "nd4", name: "Đính đá Swarovski", status: "ARCHIVED", version: 3 },
];

export function designStatuses(rows: ReadonlyArray<DesignRow>): ReadonlyArray<string> {
  return Array.from(new Set(rows.map((row) => row.status))).sort();
}

export function filterDesigns(
  rows: ReadonlyArray<DesignRow>,
  status: string,
  query: string,
): ReadonlyArray<DesignRow> {
  const normalized = query.trim().toLocaleLowerCase("vi");
  return rows.filter(
    (row) =>
      (status === "all" || row.status === status) &&
      (!normalized || row.name.toLocaleLowerCase("vi").includes(normalized)),
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
