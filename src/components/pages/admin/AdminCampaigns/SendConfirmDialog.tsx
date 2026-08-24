"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button } from "@heroui/react";
import { useEffect, useState } from "react";

import { adminService, type AdminNotificationCampaign, type AdminNotificationCampaignDraft } from "@/service";
import { formatCount } from "./normalize";

/**
 * The last, unmissable gate before an irreversible send. On open it re-counts
 * the audience through the campaign-specific preview endpoint (the authoritative
 * recipient count for THIS campaign, which may differ from the general audience
 * preview shown while composing), shows that number, and only then lets the
 * admin confirm. The confirm button stays disabled while the recount is in
 * flight and while the send request is running, so a double-tap cannot fire two
 * campaigns.
 */
export function SendConfirmDialog({
  draft,
  onClose,
  onSent,
}: Readonly<{
  draft: AdminNotificationCampaignDraft;
  onClose: () => void;
  onSent: (campaign: AdminNotificationCampaign) => void;
}>) {
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // `counting`/`error` already start in their loading state, and the dialog is
    // created fresh per send (draft.audience is stable for its lifetime), so the
    // effect only launches the async recount — no synchronous setState needed.
    let active = true;
    adminService
      .notificationCampaignAudiencePreview({ definition: draft.audience })
      .then((preview) => {
        if (!active) return;
        setRecipientCount(typeof preview.matchedCount === "number" ? preview.matchedCount : 0);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error && err.message ? err.message : "Không xác nhận được số người nhận.");
      })
      .finally(() => {
        if (active) setCounting(false);
      });
    return () => {
      active = false;
    };
  }, [draft.audience]);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const campaign = await adminService.createNotificationCampaign(draft);
      onSent(campaign);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Gửi chiến dịch thất bại.");
      setSending(false);
    }
  };

  const confirmDisabled = counting || sending || error !== null;

  return (
    <AlertDialog isOpen onOpenChange={(open) => { if (!open && !sending) onClose(); }}>
      <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
        <AlertDialog.Container size="sm" placement="center">
          <AlertDialog.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <AlertDialog.Header className="flex items-center gap-3 px-5 pt-5">
              <AlertDialog.Icon status="danger">
                <ExclamationTriangleIcon className="size-5" />
              </AlertDialog.Icon>
              <AlertDialog.Heading className="text-lg font-bold text-admin-ink">
                Gửi chiến dịch “{draft.name}”?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="px-5 py-4 text-sm leading-6 text-admin-muted">
              {counting ? (
                <span>Đang xác nhận số người nhận…</span>
              ) : error ? (
                <span className="text-danger">{error}</span>
              ) : (
                <>
                  Chiến dịch sẽ gửi tới{" "}
                  <strong className="text-admin-ink">{formatCount(recipientCount ?? 0)}</strong> người qua
                  kênh <strong className="text-admin-ink">{draft.channel}</strong>.{" "}
                  <span className="font-semibold text-danger">
                    Hành động này không thể hoàn tác.
                  </span>
                </>
              )}
            </AlertDialog.Body>
            <AlertDialog.Footer className="border-t border-admin-border px-5 py-4">
              <Button
                variant="outline"
                className="rounded-lg border-admin-border"
                isDisabled={sending}
                onPress={onClose}
              >
                Quay lại
              </Button>
              <Button
                variant="danger"
                className="rounded-lg"
                isDisabled={confirmDisabled}
                onPress={() => void send()}
              >
                {sending ? "Đang gửi…" : `Gửi tới ${formatCount(recipientCount ?? 0)} người`}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
