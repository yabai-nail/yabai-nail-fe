"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";
import { accountStatusLabels, roleLabels, type AccountRow } from "./data";

const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
const roleOptions = ["STAFF", "MANAGER", "OWNER"];
const statusOptions = ["ACTIVE", "SUSPENDED", "DISABLED"];

export function AccountModal({
  account,
  onClose,
  onSaved,
}: Readonly<{
  account: AccountRow | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const isEdit = account !== null;
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [role, setRole] = useState(account?.role ?? "STAFF");
  const [status, setStatus] = useState(account?.status ?? "ACTIVE");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    displayName.trim().length >= 2 && (isEdit || /^0\d{9}$/.test(phone.trim())) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isEdit && account) {
        await adminService.updateAccount(account.id, { displayName: displayName.trim(), role, status }, account.version);
      } else {
        await adminService.createAccount({
          phone: phone.trim(),
          displayName: displayName.trim(),
          role,
          password: password.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không lưu được tài khoản.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {isEdit ? "Sửa tài khoản" : "Thêm tài khoản"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Số điện thoại</span>
                <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0900000010" disabled={isEdit} inputMode="numeric" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Tên hiển thị</span>
                <input className={inputClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nguyễn Văn A" autoFocus />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">Vai trò</span>
                  <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value)}>
                    {roleOptions.map((code) => (<option key={code} value={code}>{roleLabels[code] ?? code}</option>))}
                  </select>
                </label>
                {isEdit ? (
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">Trạng thái</span>
                    <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
                      {statusOptions.map((code) => (<option key={code} value={code}>{accountStatusLabels[code] ?? code}</option>))}
                    </select>
                  </label>
                ) : (
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">Mật khẩu (tuỳ chọn)</span>
                    <input type="password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Để trống nếu gửi OTP" />
                  </label>
                )}
              </div>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Hủy</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
                {busy ? "Đang lưu…" : isEdit ? "Lưu" : "Thêm"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
