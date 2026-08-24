import type { AdminPromotion } from "@/service";

export type PromotionRow = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly kind: string;
  readonly status: string;
  readonly discountVnd?: number;
  readonly percentage?: number;
  readonly startsAt?: string;
  readonly endsAt?: string;
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
  PERCENTAGE: "Phần trăm",
  FIXED: "Số tiền",
};

export function adaptPromotion(promotion: AdminPromotion): PromotionRow {
  return {
    id: promotion.id,
    code: promotion.code,
    name: promotion.name,
    kind: promotion.kind,
    status: promotion.status,
    discountVnd: promotion.discountVnd,
    percentage: promotion.percentage,
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    version: promotion.version,
  };
}

export const promotionFixtures: ReadonlyArray<PromotionRow> = [
  { id: "pr1", code: "SUMMER20", name: "Hè rực rỡ 20%", kind: "PERCENTAGE", status: "ACTIVE", percentage: 20, startsAt: "2026-08-01", endsAt: "2026-08-31", version: 1 },
  { id: "pr2", code: "NEW50K", name: "Khách mới giảm 50k", kind: "FIXED", status: "ACTIVE", discountVnd: 50000, version: 2 },
  { id: "pr3", code: "VIP15", name: "Ưu đãi VIP 15%", kind: "PERCENTAGE", status: "SCHEDULED", percentage: 15, startsAt: "2026-09-01", version: 1 },
  { id: "pr4", code: "TET100K", name: "Tết giảm 100k", kind: "FIXED", status: "EXPIRED", discountVnd: 100000, version: 3 },
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
        [row.code, row.name].some((field) =>
          field.toLocaleLowerCase("vi").includes(normalized),
        )),
  );
}

export function formatDiscount(row: Pick<PromotionRow, "percentage" | "discountVnd">): string {
  if (typeof row.percentage === "number") return `${row.percentage}%`;
  if (typeof row.discountVnd === "number") return `${row.discountVnd.toLocaleString("vi-VN")} ₫`;
  return "—";
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
