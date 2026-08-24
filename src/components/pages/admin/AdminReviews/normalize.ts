import type { AdminReview } from "@/service";

/**
 * The row shape this screen renders.
 *
 * `GET /api/v1/admin/branches/{branchId}/reviews` answers with the usual
 * `{ items, pageInfo }` envelope, but the live branch carries zero reviews
 * right now, so no item was ever observed on the wire. Every field below is
 * therefore read best-effort through the `[field: string]: unknown` escape
 * hatch on `AdminReview` and falls back to blank instead of to an invented
 * value — a missing field renders as "—", never as a plausible lie.
 */
export type ReviewRow = {
  readonly id: string;
  readonly rating: number;
  readonly content: string;
  readonly customerLabel: string;
  readonly createdAt: string;
  readonly handlingStatus: string;
  readonly handlingNote: string;
  readonly replyContent: string;
  readonly replyCreatedAt: string;
  readonly version?: number;
};

export const UNHANDLED_FILTER = "__unhandled__";

/**
 * Handling statuses offered by the editor when the loaded page shows none.
 *
 * The backend never documents this enum: the OpenAPI body schema for
 * `PATCH .../reviews/{reviewId}/handling` is `{ type: object,
 * additionalProperties: true }`, and the runtime resolves the review id
 * before it validates the body, so an invalid-status probe answers
 * RESOLVE-before-validate 404 and tells us nothing. These three follow the
 * SCREAMING_SNAKE convention every other status in this API uses; whatever
 * the backend actually accepts wins, because statuses observed on real rows
 * are merged in and a rejected value surfaces the backend message inline.
 */
const FALLBACK_HANDLING_STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED"] as const;

const HANDLING_STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
};

function readString(record: Readonly<Record<string, unknown>>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readNumber(record: Readonly<Record<string, unknown>>, key: string): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readRecord(
  record: Readonly<Record<string, unknown>>,
  key: string,
): Readonly<Record<string, unknown>> {
  const value = record[key];
  return typeof value === "object" && value !== null
    ? (value as Readonly<Record<string, unknown>>)
    : {};
}

export function toReviewRow(server: AdminReview): ReviewRow {
  const record = server as unknown as Record<string, unknown>;
  const handling = readRecord(record, "handling");
  const reply = readRecord(record, "reply");
  const customerId = readString(record, "customerId");
  const customerName =
    readString(record, "customerName") || readString(record, "customerDisplayName");
  const version = record.version;

  return {
    id: readString(record, "id"),
    rating: readNumber(record, "rating"),
    content: readString(record, "content"),
    customerLabel:
      customerName || (customerId ? `Khách #${customerId.slice(0, 6)}` : "Khách ẩn danh"),
    createdAt: readString(record, "createdAt"),
    handlingStatus: readString(handling, "status"),
    handlingNote: readString(handling, "note"),
    replyContent: readString(reply, "content"),
    replyCreatedAt: readString(reply, "createdAt"),
    ...(typeof version === "number" ? { version } : {}),
  };
}

/** Statuses actually present on the loaded rows, merged with the fallbacks. */
export function collectHandlingStatuses(
  rows: ReadonlyArray<ReviewRow>,
): ReadonlyArray<string> {
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.handlingStatus) seen.add(row.handlingStatus);
  }
  for (const status of FALLBACK_HANDLING_STATUSES) seen.add(status);
  return [...seen];
}

/**
 * Handling filtering happens on the loaded page, not on the server: the
 * reviews list operation declares no filter parameter and silently ignores
 * unknown query keys, so sending one would produce a filter that looks like
 * it works and does not.
 */
export function matchesHandlingFilter(row: ReviewRow, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === UNHANDLED_FILTER) return row.handlingStatus === "";
  return row.handlingStatus === filter;
}

export function handlingStatusLabel(status: string): string {
  if (!status) return "Chưa xử lý";
  return HANDLING_STATUS_LABELS[status] ?? status;
}

export function formatRating(rating: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(clamped)}${"☆".repeat(5 - clamped)}`;
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("vi-VN");
}
