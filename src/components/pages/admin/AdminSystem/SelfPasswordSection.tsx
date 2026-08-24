"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";

import { authService } from "@/service";
import { isValidPhone, normalizePhone } from "./normalize";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Two self-service auth actions, kept deliberately apart from the account
 * management above them:
 *  - "Đổi mật khẩu" changes the CURRENTLY signed-in admin's own password
 *    (needs the current password), never anyone else's.
 *  - "Gửi yêu cầu đặt lại mật khẩu" triggers a reset flow for a phone number,
 *    for the "forgot password" case.
 */
export function SelfPasswordSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChangeOwnPasswordForm />
      <RequestResetForm />
    </div>
  );
}

function ChangeOwnPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validate = (): string | null => {
    if (!currentPassword) return "Nhập mật khẩu hiện tại.";
    if (newPassword.length < MIN_PASSWORD_LENGTH) return `Mật khẩu mới cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
    if (newPassword === currentPassword) return "Mật khẩu mới phải khác mật khẩu hiện tại.";
    if (newPassword !== confirm) return "Xác nhận mật khẩu không khớp.";
    return null;
  };

  const submit = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await authService.changeAdminPassword({ currentPassword, newPassword });
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không đổi được mật khẩu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Header className="flex flex-col gap-1 border-b border-admin-border px-5 py-4">
        <h3 className="text-sm font-bold text-admin-ink">Đổi mật khẩu của tôi</h3>
        <p className="text-xs text-admin-muted">Áp dụng cho tài khoản bạn đang đăng nhập.</p>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3 p-5 text-sm">
        <label className="flex flex-col gap-2">
          <span className="font-semibold text-admin-ink">Mật khẩu hiện tại</span>
          <input
            type="password"
            autoComplete="current-password"
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold text-admin-ink">Mật khẩu mới</span>
          <input
            type="password"
            autoComplete="new-password"
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold text-admin-ink">Xác nhận mật khẩu mới</span>
          <input
            type="password"
            autoComplete="new-password"
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
        ) : null}
        {done ? (
          <p className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-accent">Đã đổi mật khẩu.</p>
        ) : null}
        <div>
          <Button variant="primary" className="rounded-lg" onPress={() => void submit()} isDisabled={busy}>
            {busy ? "Đang đổi…" : "Đổi mật khẩu"}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

function RequestResetForm() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!isValidPhone(phone)) {
      setError("Số điện thoại phải gồm 10 số, bắt đầu bằng 0.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await authService.requestAdminPasswordReset({ phone: normalizePhone(phone) });
      setDone(true);
      setPhone("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không gửi được yêu cầu đặt lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Header className="flex flex-col gap-1 border-b border-admin-border px-5 py-4">
        <h3 className="text-sm font-bold text-admin-ink">Gửi yêu cầu đặt lại mật khẩu</h3>
        <p className="text-xs text-admin-muted">
          Gửi hướng dẫn đặt lại mật khẩu tới một số điện thoại (trường hợp quên mật khẩu).
        </p>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3 p-5 text-sm">
        <label className="flex flex-col gap-2">
          <span className="font-semibold text-admin-ink">Số điện thoại</span>
          <input
            type="tel"
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0901234567"
          />
        </label>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
        ) : null}
        {done ? (
          <p className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-accent">
            Đã gửi yêu cầu đặt lại mật khẩu.
          </p>
        ) : null}
        <div>
          <Button variant="outline" className="rounded-lg border-admin-border" onPress={() => void submit()} isDisabled={busy}>
            {busy ? "Đang gửi…" : "Gửi yêu cầu"}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
