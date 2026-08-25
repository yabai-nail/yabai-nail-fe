import type { AdminPromotion } from "@/service";

export type PromotionRow = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly type: string;
  readonly status: string;
  readonly value: number;
  readonly startAt?: string;
  readonly endAt?: string;
  readonly version: number;
};

export const promotionStatusLabels: Record<string, string> = {
  ACTIVE: "Đang chạy",
  SCHEDULED: "Lên lịch",
  EXPIRED: "Hết hạn",
  DRAFT: "Nháp",
  DISABLED: "Tắt",
};

export const promotionKindLabels: Record<string, string> = {
  PERCENT: "Phần trăm",
  FIXED: "Số tiền",
};

export function adaptPromotion(promotion: AdminPromotion): PromotionRow {
  return {
    id: promotion.id,
    code: promotion.code,
    title: promotion.title,
    type: promotion.type,
    status: promotion.status,
    value: promotion.value,
    startAt: promotion.startAt,
    endAt: promotion.endAt,
    version: promotion.version,
  };
}

export const promotionFixtures: ReadonlyArray<PromotionRow> = [
  { id: "pr1", code: "SUMMER20", title: "Hè rực rỡ 20%", type: "PERCENT", status: "ACTIVE", value: 20, startAt: "2026-08-01", endAt: "2026-08-31", version: 1 },
  { id: "pr2", code: "NEW50K", title: "Khách mới giảm 50k", type: "FIXED", status: "ACTIVE", value: 50000, version: 2 },
  { id: "pr3", code: "VIP15", title: "Ưu đãi VIP 15%", type: "PERCENT", status: "SCHEDULED", value: 15, startAt: "2026-09-01", version: 1 },
  { id: "pr4", code: "TET100K", title: "Tết giảm 100k", type: "FIXED", status: "EXPIRED", value: 100000, version: 3 },
];

export function promotionStatuses(rows: ReadonlyArray<PromotionRow>): ReadonlyArray<string> {
  return Array.from(new Set(rows.map((row) => row.status))).sort();
}

export function filterPromotions(
  rows: ReadonlyArray<PromotionRow>,
  status: string,
  query: string,
): ReadonlyArray<PromotionRow> {
  const normalized = query.trim().toLocaleLowerCase("vi");
  return rows.filter(
    (row) =>
      (status === "all" || row.status === status) &&
      (!normalized ||
        [row.code, row.title].some((field) =>
          field.toLocaleLowerCase("vi").includes(normalized),
        )),
  );
}

/** One `value`, read as a percentage or an amount depending on `type`. */
export function formatDiscount(row: Pick<PromotionRow, "type" | "value">): string {
  if (typeof row.value !== "number") return "—";
  return row.type === "PERCENT" ? `${row.value}%` : `${row.value.toLocaleString("vi-VN")} ₫`;
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
