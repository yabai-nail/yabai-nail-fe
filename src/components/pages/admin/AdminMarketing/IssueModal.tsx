"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";

export function IssueModal({
  promotionId,
  promotionName,
  onClose,
  onIssued,
}: Readonly<{
  promotionId: string;
  promotionName: string;
  onClose: () => void;
  onIssued: () => void;
}>) {
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerIds = raw
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const canSubmit = customerIds.length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.issuePromotion(promotionId, {
        customerIds,
        note: note.trim() || undefined,
      });
      onIssued();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không phát hành được.");
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
                Phát hành — {promotionName}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">ID khách hàng</span>
                <textarea
                  className="min-h-24 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink"
                  value={raw}
                  onChange={(event) => setRaw(event.target.value)}
                  placeholder="Nhập các ID, cách nhau bởi dấu phẩy hoặc xuống dòng"
                  autoFocus
                />
                <span className="text-xs text-admin-muted">{customerIds.length} khách được chọn</span>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Ghi chú (tuỳ chọn)</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Hủy</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
                {busy ? "Đang phát hành…" : "Phát hành"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
