import type { AdminRole } from "@/service";

/** Admin roles this screen can assign, most privileged last. */
export const ROLE_OPTIONS: ReadonlyArray<AdminRole> = ["STAFF", "MANAGER", "OWNER"];

const ROLE_LABELS: Record<AdminRole, string> = {
  STAFF: "Nhân viên",
  MANAGER: "Quản lý",
  OWNER: "Chủ chuỗi",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as AdminRole] ?? role;
}

export function isAdminRole(value: string): value is AdminRole {
  return (ROLE_OPTIONS as ReadonlyArray<string>).includes(value);
}

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  active: "Đang hoạt động",
  DISABLED: "Đã khoá",
  disabled: "Đã khoá",
  SUSPENDED: "Tạm ngưng",
  suspended: "Tạm ngưng",
};

export function accountStatusLabel(status: string): string {
  return ACCOUNT_STATUS_LABELS[status] ?? status;
}

/** Strip spaces so `090 000 0002` and `0900000002` validate the same way. */
export function normalizePhone(input: string): string {
  return input.replace(/\s+/g, "");
}

/** Vietnamese local mobile format used across this app: leading 0 + 9 digits. */
export function isValidPhone(input: string): boolean {
  return /^0\d{9}$/.test(normalizePhone(input));
}

export interface AccountFormValues {
  readonly phone: string;
  readonly displayName: string;
  readonly role: string;
  readonly branchIds: ReadonlyArray<string>;
}

export type AccountFieldError = "phone" | "displayName" | "role" | "branchIds";

export interface AccountValidation {
  readonly ok: boolean;
  readonly errors: Readonly<Partial<Record<AccountFieldError, string>>>;
}

/**
 * Client-side gate before any account write. `phoneRequired` is false when
 * editing (the phone is not part of the patch and cannot be changed here), true
 * when creating. STAFF and MANAGER must be scoped to at least one branch; an
 * OWNER is chain-wide and may have none.
 */
export function validateAccount(
  values: AccountFormValues,
  options: Readonly<{ phoneRequired: boolean }>,
): AccountValidation {
  const errors: Partial<Record<AccountFieldError, string>> = {};

  if (options.phoneRequired) {
    if (!values.phone.trim()) {
      errors.phone = "Nhập số điện thoại.";
    } else if (!isValidPhone(values.phone)) {
      errors.phone = "Số điện thoại phải gồm 10 số, bắt đầu bằng 0.";
    }
  }

  if (values.displayName.trim().length < 2) {
    errors.displayName = "Tên hiển thị cần ít nhất 2 ký tự.";
  }

  if (!isAdminRole(values.role)) {
    errors.role = "Chọn một vai trò hợp lệ.";
  } else if (values.role !== "OWNER" && values.branchIds.length === 0) {
    errors.branchIds = "Vai trò này phải gắn với ít nhất một chi nhánh.";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

const MISSING = "—";

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return MISSING;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return MISSING;
  return parsed.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "medium" });
}

/**
 * Parse the JSON a config editor holds. Returns the parsed object on success or
 * a Vietnamese error string, never throwing, so the caller can gate the save.
 */
export function parseConfigObject(
  text: string,
): { readonly ok: true; readonly value: Record<string, unknown> } | { readonly ok: false; readonly error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, value: {} };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "JSON không hợp lệ." };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Cấu hình phải là một đối tượng JSON." };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

/** Pretty-print a config object for editing, dropping the concurrency `version`. */
export function stringifyConfig(config: Readonly<Record<string, unknown>> | undefined): string {
  if (!config) return "{}";
  const { version: _version, ...rest } = config;
  void _version;
  return JSON.stringify(rest, null, 2);
}

export const adminSystemNormalizeMeta = {
  world: "pure",
  domain: "admin-system-normalize",
} as const;
