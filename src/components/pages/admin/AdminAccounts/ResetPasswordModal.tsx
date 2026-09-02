"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("admin.accounts");

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
      notifySuccess("Đã đặt lại mật khẩu", `Thông báo đã được gửi cho ${accountName}.`);
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("reset.failed"));
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
              <div className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("reset.channel")}</span>
                <AdminSelectField
                  label={t("reset.channel")}
                  fullWidth
                  value={notifyChannel}
                  onChange={setNotifyChannel}
                  options={[
                    { value: "SMS", label: "SMS" },
                    { value: "EMAIL", label: "Email" },
                  ]}
                />
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("reset.reason")}</span>
                <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("reset.reasonPlaceholder")} autoFocus />
              </label>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>{t("reset.cancel")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={busy} onPress={() => void submit()}>
                {busy ? t("reset.busy") : t("reset.submit")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
