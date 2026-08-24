import type { AdminAuditLog } from "@/service";

export type AuditEntry = {
  readonly id: string;
  readonly action: string;
  readonly actor: string;
  readonly target: string;
  readonly createdAt: string;
  readonly branchId?: string;
};

// Shown when the server returns no rows in design-time preview. Actions mirror the audit
// codes the backend emits (see platform.controller AuditLogEntity writes).
export const auditEntries: ReadonlyArray<AuditEntry> = [
  { id: "al1", action: "APPOINTMENT_CREATED", actor: "STAFF · Yuki", target: "Appointment · YN-1A2B", createdAt: "2026-08-24T02:15:00.000Z", branchId: "thao-dien" },
  { id: "al2", action: "PAYMENT_CAPTURED", actor: "MANAGER · Thao", target: "Payment · PM-7788", createdAt: "2026-08-24T01:50:00.000Z", branchId: "thao-dien" },
  { id: "al3", action: "CONVERSATION_MESSAGE_SENT", actor: "STAFF · Yuki", target: "Conversation · CV-9021", createdAt: "2026-08-23T11:05:00.000Z", branchId: "thao-dien" },
  { id: "al4", action: "BRANCH_SETTINGS_UPDATED", actor: "OWNER · Chủ tiệm", target: "BranchSettings · thao-dien", createdAt: "2026-08-23T09:30:00.000Z", branchId: "thao-dien" },
  { id: "al5", action: "CUSTOMER_UPDATED", actor: "MANAGER · Thao", target: "Customer · CU-3311", createdAt: "2026-08-22T14:12:00.000Z", branchId: "thao-dien" },
  { id: "al6", action: "REFRESH_TOKEN_REUSE_DETECTED", actor: "SYSTEM", target: "AuthSession · SE-1200", createdAt: "2026-08-22T08:00:00.000Z" },
  { id: "al7", action: "PAYMENT_REFUNDED", actor: "OWNER · Chủ tiệm", target: "Payment · PM-7712", createdAt: "2026-08-21T16:40:00.000Z", branchId: "thao-dien" },
  { id: "al8", action: "APPOINTMENT_CANCELLED", actor: "STAFF · Yuki", target: "Appointment · YN-0099", createdAt: "2026-08-21T10:20:00.000Z", branchId: "thao-dien" },
  { id: "al9", action: "PROMOTION_ISSUED", actor: "MANAGER · Thao", target: "Promotion · PR-55", createdAt: "2026-08-20T13:00:00.000Z", branchId: "thao-dien" },
  { id: "al10", action: "STAFF_UPDATED", actor: "OWNER · Chủ tiệm", target: "Staff · ST-04", createdAt: "2026-08-20T09:15:00.000Z", branchId: "thao-dien" },
];

/** Adapts a backend audit log into the row the table renders. */
export function adaptAuditLog(log: AdminAuditLog): AuditEntry {
  const target = [log.targetType, log.targetId].filter(Boolean).join(" · ");
  const actorType = typeof log.actorType === "string" && log.actorType ? `${log.actorType} · ` : "";
  return {
    id: log.id,
    action: log.action,
    actor: `${actorType}${log.actorId ?? "—"}`,
    target: target || "—",
    createdAt: log.createdAt,
    branchId: log.branchId,
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
  const normalized = query.trim().toLocaleLowerCase("vi");
  return entries.filter(
    (entry) =>
      (action === "all" || entry.action === action) &&
      (!normalized ||
        [entry.action, entry.actor, entry.target].some((field) =>
          field.toLocaleLowerCase("vi").includes(normalized),
        )),
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
