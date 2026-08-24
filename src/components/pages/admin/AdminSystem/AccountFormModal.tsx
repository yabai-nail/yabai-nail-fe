"use client";

import { Button, Modal } from "@heroui/react";
import { useMemo, useState } from "react";

import { adminService, type AdminAccount, type AdminBranch } from "@/service";
import {
  ROLE_OPTIONS,
  normalizePhone,
  roleLabel,
  validateAccount,
  type AccountFieldError,
} from "./normalize";

/**
 * Create or edit an admin account. Phone is only editable (and required) on
 * create — the PATCH contract does not carry it. Every field is validated on
 * the client before the request so a malformed phone, an unknown role, or a
 * branch-less non-owner never reaches the backend.
 */
export function AccountFormModal({
  account,
  branches,
  branchesLoading,
  onClose,
  onSaved,
}: Readonly<{
  account: AdminAccount | null;
  branches: ReadonlyArray<AdminBranch>;
  branchesLoading: boolean;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const isEdit = account !== null;

  const [phone, setPhone] = useState(account?.phone ?? "");
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [role, setRole] = useState<string>(account?.role ?? "STAFF");
  const [password, setPassword] = useState("");
  const [branchIds, setBranchIds] = useState<ReadonlyArray<string>>(account?.branchIds ?? []);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const validation = useMemo(
    () => validateAccount({ phone, displayName, role, branchIds }, { phoneRequired: !isEdit }),
    [phone, displayName, role, branchIds, isEdit],
  );

  const fieldError = (field: AccountFieldError): string | null =>
    showErrors ? validation.errors[field] ?? null : null;

  const toggleBranch = (id: string) => {
    setBranchIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const submit = async () => {
    setShowErrors(true);
    if (!validation.ok || busy) return;
    setBusy(true);
    setServerError(null);
    try {
      if (isEdit && account) {
        await adminService.updateAccount(
          account.id,
          {
            displayName: displayName.trim(),
            role,
            branchIds: [...branchIds],
            status: account.status,
          },
          account.version,
        );
      } else {
        await adminService.createAccount({
          phone: normalizePhone(phone),
          displayName: displayName.trim(),
          role,
          branchIds: [...branchIds],
          ...(password.trim() ? { password: password.trim() } : {}),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error && err.message ? err.message : "Không lưu được tài khoản.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {isEdit ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5 text-sm">
              <label className="flex flex-col gap-2">
                <span className="font-semibold text-admin-ink">Số điện thoại</span>
                <input
                  type="tel"
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink disabled:opacity-60"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0901234567"
                  disabled={isEdit}
                  autoFocus={!isEdit}
                />
                {isEdit ? (
                  <span className="text-xs text-admin-muted">Không thể đổi số điện thoại sau khi tạo.</span>
                ) : null}
                {fieldError("phone") ? (
                  <span role="alert" className="text-xs text-danger">{fieldError("phone")}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-semibold text-admin-ink">Tên hiển thị</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nguyễn Thị A"
                  autoFocus={isEdit}
                />
                {fieldError("displayName") ? (
                  <span role="alert" className="text-xs text-danger">{fieldError("displayName")}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-semibold text-admin-ink">Vai trò</span>
                <select
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink outline-none focus:border-admin-accent"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {roleLabel(option)}
                    </option>
                  ))}
                </select>
                {fieldError("role") ? (
                  <span role="alert" className="text-xs text-danger">{fieldError("role")}</span>
                ) : null}
              </label>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-admin-ink">Chi nhánh</span>
                {role === "OWNER" ? (
                  <p className="text-xs text-admin-muted">
                    Chủ chuỗi có quyền trên toàn hệ thống; không bắt buộc gắn chi nhánh.
                  </p>
                ) : null}
                {branchesLoading ? (
                  <p className="text-xs text-admin-muted">Đang tải danh sách chi nhánh…</p>
                ) : branches.length === 0 ? (
                  <p className="text-xs text-admin-muted">Chưa có chi nhánh nào.</p>
                ) : (
                  <div className="flex flex-col gap-1 rounded-lg border border-admin-border p-2">
                    {branches.map((branch) => (
                      <label key={branch.id} className="flex items-center gap-2 text-xs text-admin-ink">
                        <input
                          type="checkbox"
                          checked={branchIds.includes(branch.id)}
                          onChange={() => toggleBranch(branch.id)}
                        />
                        {branch.name}
                      </label>
                    ))}
                  </div>
                )}
                {fieldError("branchIds") ? (
                  <span role="alert" className="text-xs text-danger">{fieldError("branchIds")}</span>
                ) : null}
              </div>

              {!isEdit ? (
                <label className="flex flex-col gap-2">
                  <span className="font-semibold text-admin-ink">
                    Mật khẩu ban đầu <span className="font-normal text-admin-muted">(tùy chọn)</span>
                  </span>
                  <input
                    type="password"
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Bỏ trống để hệ thống tạo mật khẩu"
                    autoComplete="new-password"
                  />
                </label>
              ) : null}

              {serverError ? (
                <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                  {serverError}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>
                Huỷ
              </Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={busy}
              >
                {busy ? "Đang lưu…" : isEdit ? "Lưu" : "Thêm tài khoản"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
