import type { AdminAuditLog } from "@/service";
import { matchesSearch } from "@/lib/admin-search";

export type AuditEntry = {
  readonly id: string;
  readonly action: string;
  readonly actor: string;
  readonly target: string;
  readonly branch?: string;
  readonly createdAt: string;
};

/** Tên hiển thị tra được từ các danh sách chạy song song (tài khoản / chi nhánh). */
export type AuditLookups = {
  readonly accounts?: ReadonlyMap<string, { readonly displayName?: string; readonly role?: string }>;
  readonly branches?: ReadonlyMap<string, { readonly name?: string }>;
  readonly staff?: ReadonlyMap<string, { readonly displayName?: string }>;
  readonly services?: ReadonlyMap<string, { readonly name?: string }>;
};

const actionLabels: Record<string, string> = {
  ACCOUNT_CREATED: "Tạo tài khoản",
  ACCOUNT_UPDATED: "Cập nhật tài khoản",
  APPOINTMENT_ACTUAL_SERVICES_UPDATED: "Cập nhật dịch vụ thực tế",
  APPOINTMENT_ASSIGNED: "Phân công nhân viên",
  APPOINTMENT_CANCELLED_BY_CUSTOMER: "Khách huỷ lịch hẹn",
  APPOINTMENT_CANCELLED_BY_SALON: "Salon huỷ lịch hẹn",
  APPOINTMENT_CHECKED_IN: "Khách đã check-in",
  APPOINTMENT_COMPLETED: "Hoàn tất lịch hẹn",
  APPOINTMENT_CONFIRMED: "Xác nhận lịch hẹn",
  APPOINTMENT_CREATED: "Tạo lịch hẹn",
  APPOINTMENT_NO_SHOW: "Khách không đến",
  APPOINTMENT_RESCHEDULED: "Đổi lịch hẹn",
  BRANCH_CREATED: "Tạo chi nhánh",
  BRANCH_SETTINGS_UPDATED: "Cập nhật cài đặt chi nhánh",
  BRANCH_UPDATED: "Cập nhật chi nhánh",
  CONVERSATION_MESSAGE_SENT: "Gửi tin nhắn",
  CUSTOMER_CREATED: "Tạo khách hàng",
  CUSTOMER_NOTE_CREATED: "Thêm ghi chú khách hàng",
  CUSTOMER_NOTE_UPDATED: "Cập nhật ghi chú khách hàng",
  CUSTOMER_UPDATED: "Cập nhật khách hàng",
  LEAVE_REQUEST_APPROVED: "Duyệt nghỉ phép",
  LEAVE_REQUEST_REJECTED: "Từ chối nghỉ phép",
  NOTIFICATION_CAMPAIGN_CANCELLED: "Huỷ chiến dịch thông báo",
  NOTIFICATION_CAMPAIGN_CREATED: "Tạo chiến dịch thông báo",
  PAYMENT_CAPTURED: "Ghi nhận thanh toán",
  PAYMENT_REFUNDED: "Hoàn tiền",
  POINTS_ADJUSTED: "Điều chỉnh điểm",
  PROMOTION_CREATED: "Tạo khuyến mãi",
  PROMOTION_ISSUED: "Phát hành khuyến mãi",
  PROMOTION_UPDATED: "Cập nhật khuyến mãi",
  REFRESH_TOKEN_REUSE_DETECTED: "Phát hiện phiên đăng nhập bất thường",
  REVIEW_HANDLING_UPDATED: "Cập nhật xử lý đánh giá",
  REVIEW_REPLIED: "Phản hồi đánh giá",
  SERVICE_CREATED: "Tạo dịch vụ",
  SERVICE_UPDATED: "Cập nhật dịch vụ",
  SHIFT_CREATED: "Tạo ca làm",
  STAFF_CREATED: "Tạo nhân viên",
  STAFF_UPDATED: "Cập nhật nhân viên",
};

const resourceLabels: Record<string, string> = {
  Appointment: "Lịch hẹn",
  AuthSession: "Phiên đăng nhập",
  Branch: "Chi nhánh",
  BranchSettings: "Cài đặt chi nhánh",
  Conversation: "Cuộc trò chuyện",
  ConversationMessage: "Tin nhắn",
  Customer: "Khách hàng",
  CustomerCoupon: "Coupon khách hàng",
  CustomerNote: "Ghi chú khách hàng",
  LeaveRequest: "Yêu cầu nghỉ phép",
  NailDesignProposal: "Đề xuất mẫu nail",
  Notification: "Thông báo",
  NotificationCampaign: "Chiến dịch thông báo",
  Payment: "Thanh toán",
  Promotion: "Khuyến mãi",
  Review: "Đánh giá",
  Service: "Dịch vụ",
  ServiceCategory: "Danh mục dịch vụ",
  Staff: "Nhân viên",
  StaffCompensation: "Lương và hoa hồng",
  StaffShift: "Ca làm",
  UserAccount: "Tài khoản",
};

const roleLabels: Record<string, string> = {
  OWNER: "Chủ chuỗi",
  MANAGER: "Quản lý",
  STAFF: "Nhân viên",
};

export function auditActionLabel(action: string): string {
  return actionLabels[action] ?? action.toLocaleLowerCase().replaceAll("_", " ").replace(/^./, (char) => char.toLocaleUpperCase());
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
 * dùng nhãn loại bản ghi thay vì đưa mã cơ sở dữ liệu ra giao diện.
 */
export function adaptAuditLog(log: AdminAuditLog, lookups: AuditLookups = {}): AuditEntry {
  const actorId = typeof log.actorId === "string" ? log.actorId : undefined;
  const account = actorId ? lookups.accounts?.get(actorId) : undefined;
  const accountName = account?.displayName;
  const actor = accountName
    ? [roleLabels[account?.role?.toUpperCase() ?? ""], accountName].filter(Boolean).join(" · ")
    : actorId
      ? "Tài khoản không xác định"
      : "Hệ thống";

  const resourceId = typeof log.resourceId === "string" ? log.resourceId : undefined;
  const resourceType = log.resourceType ?? "";
  const resourceName = resourceId
    ? resourceType === "Branch"
      ? lookups.branches?.get(resourceId)?.name
      : resourceType === "Staff"
        ? lookups.staff?.get(resourceId)?.displayName
        : resourceType === "Service"
          ? lookups.services?.get(resourceId)?.name
          : resourceType === "UserAccount" || resourceType === "Customer"
            ? lookups.accounts?.get(resourceId)?.displayName
            : undefined
    : undefined;
  const target = [resourceLabels[resourceType] ?? resourceType, resourceName].filter(Boolean).join(" · ") || "Bản ghi hệ thống";

  const metadataBranchId = (log.metadata as { branchId?: unknown } | undefined)?.branchId;
  const branchId = typeof metadataBranchId === "string" ? metadataBranchId : undefined;
  const branchName = branchId ? lookups.branches?.get(branchId)?.name : undefined;

  return {
    id: log.id,
    action: log.action,
    actor,
    target,
    branch: branchId ? (branchName ?? "Chi nhánh không xác định") : undefined,
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
      matchesSearch(query, [entry.action, auditActionLabel(entry.action), entry.actor, entry.target]),
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
