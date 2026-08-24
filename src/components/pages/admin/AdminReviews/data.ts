import type { AdminReview } from "@/service";

export type ReviewRow = {
  readonly id: string;
  readonly customerId: string;
  readonly rating: number;
  readonly content: string;
  readonly handlingStatus: string;
  readonly replyContent?: string;
  readonly createdAt: string;
  readonly version: number;
};

export const handlingStatusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  RESOLVED: "Đã xử lý",
  ESCALATED: "Chuyển cấp trên",
};

export const reviewFixtures: ReadonlyArray<ReviewRow> = [
  { id: "rv1", customerId: "Nguyễn An", rating: 5, content: "Nhân viên làm rất tỉ mỉ, sẽ quay lại!", handlingStatus: "RESOLVED", replyContent: "Cảm ơn chị đã ủng hộ ạ!", createdAt: "2026-08-23T10:00:00.000Z", version: 2 },
  { id: "rv2", customerId: "Trần Bích", rating: 4, content: "Móng đẹp nhưng chờ hơi lâu.", handlingStatus: "PENDING", createdAt: "2026-08-22T09:30:00.000Z", version: 1 },
  { id: "rv3", customerId: "Lê Cường", rating: 2, content: "Màu lên không giống mẫu.", handlingStatus: "ESCALATED", createdAt: "2026-08-21T15:10:00.000Z", version: 1 },
  { id: "rv4", customerId: "Phạm Dung", rating: 5, content: "Không gian sạch sẽ, thơm.", handlingStatus: "RESOLVED", replyContent: "Cảm ơn chị nhiều!", createdAt: "2026-08-20T13:45:00.000Z", version: 3 },
  { id: "rv5", customerId: "Vũ Hà", rating: 3, content: "Ổn, giá hơi cao so với kỳ vọng.", handlingStatus: "PENDING", createdAt: "2026-08-19T11:20:00.000Z", version: 1 },
];

export function adaptReview(review: AdminReview): ReviewRow {
  return {
    id: review.id,
    customerId: review.customerId,
    rating: review.rating,
    content: review.content ?? "",
    handlingStatus: review.handling?.status ?? "PENDING",
    replyContent: review.reply?.content,
    createdAt: review.createdAt,
    version: review.version,
  };
}

export function handlingStatuses(rows: ReadonlyArray<ReviewRow>): ReadonlyArray<string> {
  return Array.from(new Set(rows.map((row) => row.handlingStatus))).sort();
}

export function filterReviews(
  rows: ReadonlyArray<ReviewRow>,
  status: string,
  query: string,
): ReadonlyArray<ReviewRow> {
  const normalized = query.trim().toLocaleLowerCase("vi");
  return rows.filter(
    (row) =>
      (status === "all" || row.handlingStatus === status) &&
      (!normalized ||
        [row.customerId, row.content].some((field) =>
          field.toLocaleLowerCase("vi").includes(normalized),
        )),
  );
}

export function ratingStars(rating: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
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
