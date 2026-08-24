"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";

export function ResetPasswordModal({
  accountId,
  accountName,
  onClose,
  onDone,
}: Readonly<{
  accountId: string;
  accountName: string;
  onClose: () => void;
  onDone: () => void;
}>) {
  const [reason, setReason] = useState("");
  const [notifyChannel, setNotifyChannel] = useState("SMS");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminService.resetAccountPassword(accountId, {
        reason: reason.trim() || undefined,
        notifyChannel,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không đặt lại được mật khẩu.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                Đặt lại mật khẩu — {accountName}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Kênh thông báo</span>
                <select className={inputClass} value={notifyChannel} onChange={(event) => setNotifyChannel(event.target.value)}>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Lý do (tuỳ chọn)</span>
                <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhân viên quên mật khẩu" autoFocus />
              </label>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Hủy</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={busy} onPress={() => void submit()}>
                {busy ? "Đang xử lý…" : "Đặt lại mật khẩu"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
