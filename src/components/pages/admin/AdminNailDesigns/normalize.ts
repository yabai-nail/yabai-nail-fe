import type { AdminNailDesign } from "@/service";

/**
 * Row shape rendered by the nail-design grid and the proposal queue.
 *
 * What the live backend actually told us, and what it did not:
 *
 * - `GET /api/v1/nail-designs?limit=3` (the unauthenticated twin of the admin
 *   list) answers
 *   `{ designs: [], items: [], facets: { styles: [], nailLengths: [] },
 *      pageInfo: { endCursor, hasNextPage, limit } }`.
 *   So the envelope is the usual `{ items, pageInfo }` this app already reads,
 *   and a design is faceted by style and nail length. The catalogue is empty on
 *   the live branch, so no item was ever observed on the wire.
 * - Runtime Swagger (`/docs-json`) types every nail-design request body as
 *   `{ type: "object", additionalProperties: true }` and every response as the
 *   generic `ApiSuccessEnvelope`. It contributes no field names either.
 *
 * Every field below is therefore read best-effort through the
 * `[field: string]: unknown` escape hatch on `AdminNailDesign` and falls back to
 * blank, never to an invented value. `imageUrl` / `name` / `id` are not guesses:
 * they are the field names `src/service/catalog/types.ts` and the public
 * `/designs` page already commit to for the very same resource.
 */
export type DesignRow = {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly status: string;
  readonly style: string;
  readonly nailLength: string;
  readonly proposalId: string;
  readonly proposedBy: string;
  readonly createdAt: string;
  readonly version?: number;
};

/**
 * Statuses offered by the create/edit form when the loaded page shows none.
 *
 * The backend documents no enum for this field (see above), so these follow the
 * SCREAMING_SNAKE convention every other status in this API uses. Whatever the
 * backend actually accepts wins: statuses seen on real rows are merged in, and
 * a rejected value surfaces the backend's own message inline instead of being
 * swallowed.
 */
const FALLBACK_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const STATUS_LABELS: Readonly<Record<string, string>> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đang hiển thị",
  ARCHIVED: "Đã ẩn",
  PENDING: "Chờ duyệt",
  PENDING_REVIEW: "Chờ duyệt",
  PROPOSED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

/** Statuses that mark a row as a customer proposal awaiting a decision. */
const PENDING_STATUSES = new Set(["PENDING", "PENDING_REVIEW", "PROPOSED"]);

function readString(record: Readonly<Record<string, unknown>>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
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

export function toDesignRow(server: AdminNailDesign): DesignRow {
  const record = server as unknown as Record<string, unknown>;
  const proposal = readRecord(record, "proposal");
  const version = record.version;

  return {
    id: readString(record, "id"),
    name: readString(record, "name"),
    imageUrl: readString(record, "imageUrl") || readString(record, "thumbnailUrl"),
    status: readString(record, "status"),
    style: readString(record, "style"),
    nailLength: readString(record, "nailLength"),
    proposalId: readString(record, "proposalId") || readString(proposal, "id"),
    proposedBy:
      readString(record, "proposedByName") ||
      readString(proposal, "customerName") ||
      readString(proposal, "proposedByName"),
    createdAt: readString(record, "createdAt") || readString(proposal, "createdAt"),
    ...(typeof version === "number" ? { version } : {}),
  };
}

/**
 * A row belongs to the proposal queue when it carries a proposal id — that id is
 * the only thing `POST /api/v1/admin/nail-design-proposals/{proposalId}/decision`
 * can be called with. A row that merely *looks* pending but exposes no proposal
 * id stays in the catalogue grid, because deciding on it is impossible.
 */
export function isProposalRow(row: DesignRow): boolean {
  return row.proposalId !== "";
}

/** Pending-looking rows without a proposal id: shown, but not decidable. */
export function isPendingRow(row: DesignRow): boolean {
  return PENDING_STATUSES.has(row.status.toUpperCase());
}

/** Statuses actually present on the loaded rows, merged with the fallbacks. */
export function collectStatuses(rows: ReadonlyArray<DesignRow>): ReadonlyArray<string> {
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.status) seen.add(row.status);
  }
  for (const status of FALLBACK_STATUSES) seen.add(status);
  return [...seen];
}

export function statusLabel(status: string): string {
  if (!status) return "Chưa đặt trạng thái";
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

/**
 * Name filtering happens on the loaded page, not on the server: the list
 * operation declares no query parameter at all in runtime Swagger, and this API
 * silently ignores unknown query keys — sending one would produce a filter that
 * looks like it works and does not.
 */
export function matchesQuery(row: DesignRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    row.name.toLowerCase().includes(needle) ||
    row.style.toLowerCase().includes(needle) ||
    row.nailLength.toLowerCase().includes(needle)
  );
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("vi-VN");
}
