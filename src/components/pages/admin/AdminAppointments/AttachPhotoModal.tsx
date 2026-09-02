"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { adminMediaService } from "@/service";
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
  const t = useTranslations("admin.appointments");
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
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error(t("photo.typeError"));
      }
      if (file.size < 1 || file.size > 10_000_000) {
        throw new Error(t("photo.sizeError"));
      }
      const upload = await adminMediaService.startUpload({
        fileName: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        sizeBytes: file.size,
      });
      mediaId = upload.mediaId;
      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: upload.requiredHeaders,
        body: file,
      });
      if (!response.ok) throw new Error(t("photo.uploadFailed"));
      await adminMediaService.completeUpload(mediaId);
      onConfirm({ mediaId, kind, note: note.trim() || undefined });
    } catch (thrown) {
      if (mediaId) await adminMediaService.abortUpload(mediaId).catch(() => undefined);
      setUploadError(thrown instanceof Error ? thrown.message : t("photo.genericFailed"));
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
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("photo.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-4 text-sm">
              <p className="text-[0.7rem] leading-4 text-admin-muted">
                {t.rich("photo.description", {
                  name: appointment.customer.name,
                  strong: (chunks) => <strong className="text-admin-ink">{chunks}</strong>,
                })}
              </p>

              <label htmlFor="attach-photo-file" className="block text-xs font-semibold text-admin-ink">
                {t("photo.file")}
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
                {t("photo.kind")}
                <AdminSelectField
                  label={t("photo.kind")}
                  fullWidth
                  className="mt-1"
                  value={kind}
                  onChange={(value) => setKind(value as typeof kind)}
                  options={[
                    { value: "BEFORE", label: t("photo.before") },
                    { value: "AFTER", label: t("photo.after") },
                    { value: "OTHER", label: t("photo.other") },
                  ]}
                />
              </div>

              <label htmlFor="attach-media-note" className="block text-xs font-semibold text-admin-ink">
                {t("photo.note")}
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
                {t("photo.close")}
              </Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void uploadAndAttach()}
                isDisabled={submitting || uploading || !file}
              >
                {submitting || uploading ? t("photo.busy") : t("photo.submit")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
