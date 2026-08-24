"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";

export function CancelCampaignDialog({
  campaignId,
  campaignName,
  onClose,
  onCancelled,
}: Readonly<{
  campaignId: string;
  campaignName: string;
  onClose: () => void;
  onCancelled: () => void;
}>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminService.cancelNotificationCampaign(campaignId);
      onCancelled();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không huỷ được chiến dịch.");
      setBusy(false);
    }
  };

  return (
    <AlertDialog isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
        <AlertDialog.Container size="sm" placement="center">
          <AlertDialog.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <AlertDialog.Header className="flex items-center gap-3 px-5 pt-5">
              <AlertDialog.Icon status="danger">
                <ExclamationTriangleIcon className="size-5" />
              </AlertDialog.Icon>
              <AlertDialog.Heading className="text-lg font-bold text-admin-ink">
                Huỷ chiến dịch “{campaignName}”?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="px-5 py-4 text-sm leading-6 text-admin-muted">
              Chỉ chiến dịch chưa gửi mới huỷ được. Nếu chiến dịch đã bắt đầu gửi, hệ thống sẽ từ chối.
              {error ? <span className="mt-2 block text-danger">{error}</span> : null}
            </AlertDialog.Body>
            <AlertDialog.Footer className="border-t border-admin-border px-5 py-4">
              <Button
                variant="outline"
                className="rounded-lg border-admin-border"
                isDisabled={busy}
                onPress={onClose}
              >
                Giữ chiến dịch
              </Button>
              <Button
                variant="danger"
                className="rounded-lg"
                isDisabled={busy}
                onPress={() => void confirm()}
              >
                {busy ? "Đang huỷ…" : "Xác nhận huỷ"}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
