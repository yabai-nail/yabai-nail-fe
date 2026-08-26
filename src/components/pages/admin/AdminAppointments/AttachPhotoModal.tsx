"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import { mediaService } from "@/service";
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
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<"BEFORE" | "AFTER" | "OTHER">("AFTER");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadAndAttach = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    let mediaId: string | null = null;
    try {
      const upload = await mediaService.startUpload({
        kind: "APPOINTMENT_PHOTO",
        contentType: file.type || "application/octet-stream",
        filename: file.name,
        sizeBytes: file.size,
      });
      mediaId = upload.mediaId;
      const response = await fetch(upload.uploadUrl, {
        method: upload.method ?? "PUT",
        headers: upload.headers,
        body: file,
      });
      if (!response.ok) throw new Error("Không tải được ảnh lên kho lưu trữ.");
      await mediaService.completeUpload(mediaId);
      onConfirm({ mediaId, kind, note: note.trim() || undefined });
    } catch (thrown) {
      if (mediaId) await mediaService.abortUpload(mediaId).catch(() => undefined);
      setUploadError(thrown instanceof Error ? thrown.message : "Không tải được ảnh.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !uploading && !submitting) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4">
              <PhotoIcon className="size-5 text-admin-accent" />
              <Modal.Heading className="text-base font-bold text-admin-ink">Đính kèm ảnh</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-4 text-sm">
              <p className="text-[0.7rem] leading-4 text-admin-muted">
                Chọn ảnh cần đính kèm vào lịch của <strong className="text-admin-ink">{appointment.customer.name}</strong>.
              </p>

              <label htmlFor="attach-photo-file" className="block text-xs font-semibold text-admin-ink">
                Tệp ảnh
                <input
                  id="attach-photo-file"
                  type="file"
                  accept="image/*"
                  disabled={uploading || submitting}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
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

              {uploadError || error ? <p role="alert" className="text-xs text-admin-danger">{uploadError ?? error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="border-t border-admin-border px-5 py-4">
              <Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose} isDisabled={submitting || uploading}>
                Đóng
              </Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void uploadAndAttach()}
                isDisabled={submitting || uploading || !file}
              >
                {submitting || uploading ? "Đang gửi…" : "Đính kèm"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
