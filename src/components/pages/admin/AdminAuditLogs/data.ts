import type { AdminAuditLog } from "@/service";
import { matchesSearch } from "@/lib/admin-search";

export type AuditEntry = {
  readonly id: string;
  readonly action: string;
  readonly actor: string;
  /** Giá trị đầy đủ (UUID) cho tooltip khi ô hiển thị bản rút gọn. */
  readonly actorTitle?: string;
  readonly target: string;
  readonly targetTitle?: string;
  readonly branch?: string;
  readonly branchTitle?: string;
  readonly createdAt: string;
};

/** Tên hiển thị tra được từ các danh sách chạy song song (tài khoản / chi nhánh). */
export type AuditLookups = {
  readonly accounts?: ReadonlyMap<string, { readonly displayName?: string; readonly role?: string }>;
  readonly branches?: ReadonlyMap<string, { readonly name?: string }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Rút UUID trần xuống 8 ký tự đầu; giá trị khác giữ nguyên. */
export function shortenId(value: string): string {
  return uuidPattern.test(value) ? value.slice(0, 8) : value;
}

// Shown when the server returns no rows in design-time preview. Actions mirror the audit
// codes the backend emits (see platform.controller AuditLogEntity writes).
export const auditEntries: ReadonlyArray<AuditEntry> = [
  { id: "al1", action: "APPOINTMENT_CREATED", actor: "STAFF · Yuki", target: "Appointment · YN-1A2B", createdAt: "2026-08-24T02:15:00.000Z", branch: "Thảo Điền" },
  { id: "al2", action: "PAYMENT_CAPTURED", actor: "MANAGER · Thao", target: "Payment · PM-7788", createdAt: "2026-08-24T01:50:00.000Z", branch: "Thảo Điền" },
  { id: "al3", action: "CONVERSATION_MESSAGE_SENT", actor: "STAFF · Yuki", target: "Conversation · CV-9021", createdAt: "2026-08-23T11:05:00.000Z", branch: "Thảo Điền" },
  { id: "al4", action: "BRANCH_SETTINGS_UPDATED", actor: "OWNER · Chủ tiệm", target: "BranchSettings · thao-dien", createdAt: "2026-08-23T09:30:00.000Z", branch: "Thảo Điền" },
  { id: "al5", action: "CUSTOMER_UPDATED", actor: "MANAGER · Thao", target: "Customer · CU-3311", createdAt: "2026-08-22T14:12:00.000Z", branch: "Thảo Điền" },
  { id: "al6", action: "REFRESH_TOKEN_REUSE_DETECTED", actor: "SYSTEM", target: "AuthSession · SE-1200", createdAt: "2026-08-22T08:00:00.000Z" },
  { id: "al7", action: "PAYMENT_REFUNDED", actor: "OWNER · Chủ tiệm", target: "Payment · PM-7712", createdAt: "2026-08-21T16:40:00.000Z", branch: "Thảo Điền" },
  { id: "al8", action: "APPOINTMENT_CANCELLED", actor: "STAFF · Yuki", target: "Appointment · YN-0099", createdAt: "2026-08-21T10:20:00.000Z", branch: "Thảo Điền" },
  { id: "al9", action: "PROMOTION_ISSUED", actor: "MANAGER · Thao", target: "Promotion · PR-55", createdAt: "2026-08-20T13:00:00.000Z", branch: "Thảo Điền" },
  { id: "al10", action: "STAFF_UPDATED", actor: "OWNER · Chủ tiệm", target: "Staff · ST-04", createdAt: "2026-08-20T09:15:00.000Z", branch: "Thảo Điền" },
];

/**
 * Adapts a backend audit log into the row the table renders.
 *
 * Backend đặt đối tượng ở `resourceType`/`resourceId` và chi nhánh ở
 * `metadata.branchId`. Id được tra sang tên qua `lookups`; không tra được thì
 * rút gọn và giữ giá trị đầy đủ trong `*Title` cho tooltip.
 */
export function adaptAuditLog(log: AdminAuditLog, lookups: AuditLookups = {}): AuditEntry {
  const actorId = typeof log.actorId === "string" ? log.actorId : undefined;
  const account = actorId ? lookups.accounts?.get(actorId) : undefined;
  const accountName = account?.displayName;
  const actor = accountName
    ? [account?.role, accountName].filter(Boolean).join(" · ")
    : actorId
      ? shortenId(actorId)
      : "—";

  const resourceId = typeof log.resourceId === "string" ? log.resourceId : undefined;
  const target =
    [log.resourceType, resourceId && shortenId(resourceId)].filter(Boolean).join(" · ") || "—";

  const metadataBranchId = (log.metadata as { branchId?: unknown } | undefined)?.branchId;
  const branchId = typeof metadataBranchId === "string" ? metadataBranchId : undefined;
  const branchName = branchId ? lookups.branches?.get(branchId)?.name : undefined;

  return {
    id: log.id,
    action: log.action,
    actor,
    actorTitle: actorId,
    target,
    targetTitle: resourceId,
    branch: branchId ? (branchName ?? shortenId(branchId)) : undefined,
    branchTitle: branchId,
    createdAt: log.createdAt,
  };
}

/** Distinct action codes present in the list, for the filter dropdown. */
export function auditActions(entries: ReadonlyArray<AuditEntry>): ReadonlyArray<string> {
  return Array.from(new Set(entries.map((entry) => entry.action))).sort();
}

export function filterAuditEntries(
  entries: ReadonlyArray<AuditEntry>,
  query: string,
  action: string,
): ReadonlyArray<AuditEntry> {
  return entries.filter(
    (entry) =>
      (action === "all" || entry.action === action) &&
      matchesSearch(query, [entry.action, entry.actor, entry.target]),
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

export function formatAuditTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
