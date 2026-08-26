"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";

export function ReviewReplyModal({
  branchId,
  reviewId,
  version,
  customerLabel,
  onClose,
  onReplied,
}: Readonly<{
  branchId: string;
  reviewId: string;
  version: number;
  customerLabel: string;
  onClose: () => void;
  onReplied: () => void;
}>) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = content.trim().length >= 2 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.replyToBranchReview(branchId, reviewId, { content: content.trim() }, version);
      onReplied();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không gửi được phản hồi.");
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
                Trả lời đánh giá — {customerLabel}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Nội dung phản hồi</span>
                <textarea
                  className="min-h-28 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Cảm ơn bạn đã đánh giá..."
                  autoFocus
                />
              </label>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Hủy</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canSubmit}
                onPress={() => void submit()}
              >
                {busy ? "Đang gửi…" : "Gửi phản hồi"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
