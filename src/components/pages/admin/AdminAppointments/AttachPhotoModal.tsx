"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import type { Appointment } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

export function AttachPhotoModal({
  appointment,
  onClose,
  onConfirm,
  submitting = false,
  error = null,
}: Readonly<{
  appointment: Appointment;
  onClose: () => void;
  onConfirm: (input: { mediaId: string; kind?: string; note?: string }) => void;
  submitting?: boolean;
  error?: string | null;
}>) {
  const [mediaId, setMediaId] = useState("");
  const [kind, setKind] = useState<"BEFORE" | "AFTER" | "OTHER">("AFTER");
  const [note, setNote] = useState("");

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <Modal.Header className="flex items-center gap-3 border-b border-admin-border px-5 py-4">
              <PhotoIcon className="size-5 text-admin-accent" />
              <Modal.Heading className="text-base font-bold text-admin-ink">Đính kèm ảnh</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-4 text-sm">
              <p className="text-[0.7rem] leading-4 text-admin-muted">
                Lịch của <strong className="text-admin-ink">{appointment.customer.name}</strong>. Nhập
                <code className="mx-1 rounded bg-admin-soft px-1 text-[0.65rem]">mediaId</code>
                đã upload trước qua <code className="rounded bg-admin-soft px-1 text-[0.65rem]">/media/uploads</code>.
              </p>

              <label htmlFor="attach-media-id" className="block text-xs font-semibold text-admin-ink">
                Media ID
                <input
                  id="attach-media-id"
                  value={mediaId}
                  onChange={(event) => setMediaId(event.target.value)}
                  placeholder="uuid từ media/uploads/complete"
                  className="mt-1 block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-sm text-admin-ink"
                />
              </label>

              <div className="block text-xs font-semibold text-admin-ink">
                Loại ảnh
                <AdminSelectField
                  label="Loại ảnh"
                  fullWidth
                  className="mt-1"
                  value={kind}
                  onChange={(value) => setKind(value as typeof kind)}
                  options={[
                    { value: "BEFORE", label: "Trước dịch vụ" },
                    { value: "AFTER", label: "Sau dịch vụ" },
                    { value: "OTHER", label: "Khác" },
                  ]}
                />
              </div>

              <label htmlFor="attach-media-note" className="block text-xs font-semibold text-admin-ink">
                Ghi chú (tuỳ chọn)
                <textarea
                  id="attach-media-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-sm text-admin-ink"
                />
              </label>

              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="border-t border-admin-border px-5 py-4">
              <Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose} isDisabled={submitting}>
                Đóng
              </Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() =>
                  onConfirm({
                    mediaId: mediaId.trim(),
                    kind,
                    note: note.trim() || undefined,
                  })
                }
                isDisabled={submitting || mediaId.trim().length === 0}
              >
                {submitting ? "Đang gửi…" : "Đính kèm"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
