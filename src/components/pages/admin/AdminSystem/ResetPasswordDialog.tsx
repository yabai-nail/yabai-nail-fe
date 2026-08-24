"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService, type AdminAccount } from "@/service";
import { formatDateTime } from "./normalize";

/**
 * Owner-triggered password reset for ANOTHER account. The backend returns a
 * one-time reset token (and expiry) that the owner reads out to the user; this
 * is distinct from the signed-in admin changing their own password. The token
 * is shown once, here, and never persisted.
 */
export function ResetPasswordDialog({
  account,
  onClose,
}: Readonly<{
  account: AdminAccount;
  onClose: () => void;
}>) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ token: string | null; expiresAt: string | null } | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const reset = await adminService.resetAccountPassword(account.id, {
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setResult({ token: reset.resetToken ?? null, expiresAt: reset.expiresAt ?? null });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không đặt lại được mật khẩu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                Đặt lại mật khẩu — {account.displayName}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5 text-sm">
              {result ? (
                <div className="flex flex-col gap-3">
                  <p className="text-admin-ink">Đã tạo yêu cầu đặt lại mật khẩu.</p>
                  {result.token ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-admin-muted">Mã đặt lại (chỉ hiện một lần)</span>
                      <code className="break-all rounded-lg bg-admin-canvas px-3 py-2 font-mono text-xs text-admin-ink">
                        {result.token}
                      </code>
                      <span className="text-xs text-admin-muted">
                        Chuyển mã này cho người dùng để họ đặt mật khẩu mới.
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-admin-muted">
                      Hệ thống đã gửi hướng dẫn đặt lại cho người dùng.
                    </p>
                  )}
                  {result.expiresAt ? (
                    <span className="text-xs text-admin-muted">
                      Hết hạn: {formatDateTime(result.expiresAt)}
                    </span>
                  ) : null}
                </div>
              ) : (
                <>
                  <p className="text-admin-muted">
                    Thao tác này tạo mã đặt lại mật khẩu cho{" "}
                    <strong className="text-admin-ink">{account.phone}</strong>. Mật khẩu cũ sẽ ngừng hiệu lực.
                  </p>
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-admin-ink">
                      Lý do <span className="font-normal text-admin-muted">(tùy chọn)</span>
                    </span>
                    <input
                      className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Người dùng quên mật khẩu"
                    />
                  </label>
                  {error ? (
                    <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                      {error}
                    </p>
                  ) : null}
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              {result ? (
                <Button variant="primary" className="rounded-lg" onPress={onClose}>
                  Đóng
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>
                    Huỷ
                  </Button>
                  <Button
                    variant="danger"
                    className="rounded-lg"
                    onPress={() => void submit()}
                    isDisabled={busy}
                  >
                    {busy ? "Đang xử lý…" : "Đặt lại mật khẩu"}
                  </Button>
                </>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
