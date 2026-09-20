import type { AdminReview } from "@/service";
import { matchesSearch } from "@/lib/admin-search";

export type ReviewRow = {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly rating: number;
  readonly content: string;
  readonly handlingStatus: string;
  readonly source: "CUSTOMER_APP" | "COUNTER";
  readonly publicationStatus: "PENDING" | "PUBLISHED" | "HIDDEN";
  readonly replyContent?: string;
  readonly createdAt: string;
  readonly version: number;
};

export const reviewFixtures: ReadonlyArray<ReviewRow> = [
  { id: "rv1", customerId: "cust-1", customerName: "Nguyen An", rating: 5, content: "Nhan vien lam rat ti mi, se quay lai!", handlingStatus: "RESOLVED", source: "CUSTOMER_APP", publicationStatus: "PUBLISHED", replyContent: "Cam on chi da ung ho!", createdAt: "2026-08-23T10:00:00.000Z", version: 2 },
  { id: "rv2", customerId: "cust-2", customerName: "Tran Bich", rating: 4, content: "Mong dep nhung cho hoi lau.", handlingStatus: "NEW", source: "COUNTER", publicationStatus: "PENDING", createdAt: "2026-08-22T09:30:00.000Z", version: 1 },
  { id: "rv3", customerId: "cust-3", customerName: "Le Cuong", rating: 2, content: "Mau len khong giong mau.", handlingStatus: "IN_PROGRESS", source: "CUSTOMER_APP", publicationStatus: "HIDDEN", createdAt: "2026-08-21T15:10:00.000Z", version: 1 },
  { id: "rv4", customerId: "cust-4", customerName: "Pham Dung", rating: 5, content: "Khong gian sach se, thoai mai.", handlingStatus: "RESOLVED", source: "CUSTOMER_APP", publicationStatus: "PUBLISHED", replyContent: "Cam on chi nhieu!", createdAt: "2026-08-20T13:45:00.000Z", version: 3 },
  { id: "rv5", customerId: "cust-5", customerName: "Vu Ha", rating: 3, content: "On, gia hoi cao so voi ky vong.", handlingStatus: "NEW", source: "COUNTER", publicationStatus: "PENDING", createdAt: "2026-08-19T11:20:00.000Z", version: 1 },
];

export function adaptReview(
  review: AdminReview,
  customerNames: ReadonlyMap<string, string> | undefined,
  unnamed: string,
): ReviewRow {
  return {
    id: review.id,
    customerId: review.customerId,
    customerName: review.customer?.displayName ?? customerNames?.get(review.customerId) ?? unnamed,
    rating: review.rating,
    content: review.comment ?? "",
    handlingStatus: review.handlingStatus,
    source: review.source,
    publicationStatus: review.publicationStatus,
    replyContent: review.managerReply ?? undefined,
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
  return rows.filter(
    (row) =>
      (status === "all" || row.handlingStatus === status) &&
      matchesSearch(query, [row.customerName, row.content]),
  );
}

export function ratingStars(rating: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return "\u2605".repeat(clamped) + "\u2606".repeat(5 - clamped);
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
