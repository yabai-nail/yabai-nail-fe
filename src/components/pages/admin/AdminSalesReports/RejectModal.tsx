"use client";

import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Rejecting needs a reason the technician will read, so it is the one decision that asks
 * before acting. Approving and reopening go straight through from the row.
 */
export function RejectModal({
  count,
  busy,
  onClose,
  onConfirm,
}: Readonly<{
  /** How many reports the reason applies to. */
  count: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}>) {
  const t = useTranslations("admin.salesReports.reject");
  const [reason, setReason] = useState("");
  const canConfirm = reason.trim().length > 0 && reason.trim().length <= 500 && !busy;

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("title", { count })}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("reason")}</span>
                <textarea
                  value={reason}
                  maxLength={500}
                  rows={3}
                  autoFocus
                  onChange={(event) => setReason(event.target.value)}
                  className="rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink"
                />
                <span className="text-xs text-admin-muted">{t("reasonHint")}</span>
              </label>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("cancel")}</Button>
              <Button
                variant="ghost"
                className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90"
                isDisabled={!canConfirm}
                onPress={() => onConfirm(reason.trim())}
              >
                {busy ? t("rejecting") : t("confirm")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
