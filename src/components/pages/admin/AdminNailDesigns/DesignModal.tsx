"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { adminMediaService, adminService, type AdminNailDesign } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import type { DesignRow } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { AdminNailDesignThumbnail } from "./AdminNailDesignThumbnail";
import { parseIndicativePrice } from "./design-price";

const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
const statusOptions = ["DRAFT", "PUBLISHED", "ARCHIVED", "HIDDEN"];

export function DesignModal({
  design,
  onClose,
  onSaved,
}: Readonly<{
  design: DesignRow | null;
  onClose: () => void;
  onSaved: (saved: AdminNailDesign) => Promise<void>;
}>) {
  const t = useTranslations("admin.nailDesigns");
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;
  const isEdit = design !== null;
  const [name, setName] = useState(design?.title ?? "");
  const [status, setStatus] = useState(design?.status ?? "DRAFT");
  const [indicativePrice, setIndicativePrice] = useState(design?.indicativePrice === null || design?.indicativePrice === undefined ? "" : String(design.indicativePrice));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  const selectImage = (file: File | null) => {
    if (!file) return;
    const nextError = !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ? t("modal.imageUnsupported")
      : file.size === 0
        ? t("modal.imageEmpty")
        : file.size > 10_000_000
          ? t("modal.imageTooLarge")
          : null;
    setImageError(nextError);
    setImageFile(nextError ? null : file);
    setImagePreviewUrl(nextError ? null : URL.createObjectURL(file));
  };

  const parsedPrice = parseIndicativePrice(indicativePrice);
  const canSubmit = name.trim().length >= 2 && parsedPrice !== undefined && !imageError && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    let uploadedMediaId: string | null = null;
    try {
      if (imageFile) uploadedMediaId = await adminMediaService.uploadFile(imageFile);
      const mediaIds = uploadedMediaId ? [uploadedMediaId] : design?.mediaIds;
      const saved = isEdit && design
        ? await adminService.updateNailDesign(
          design.id,
          // The backend names this `title`; `name` was never read, so the
          // request failed validation with an empty title every time.
          // Publishing additionally needs explicit consent.
          {
            title: name.trim(),
            indicativePrice: parsedPrice!,
            status,
            ...(mediaIds ? { mediaIds } : {}),
            ...(status === "PUBLISHED" ? { consentToPublish: true } : {}),
          },
          design.version,
        )
        : await adminService.createNailDesign({
          title: name.trim(),
          indicativePrice: parsedPrice!,
          status,
          ...(mediaIds ? { mediaIds } : {}),
          ...(status === "PUBLISHED" ? { consentToPublish: true } : {}),
        });
      notifySuccess(isEdit ? t("modal.updated") : t("modal.created"));
      await onSaved(saved);
      onClose();
    } catch (err) {
      if (uploadedMediaId) {
        try {
          await adminMediaService.deleteMedia(uploadedMediaId);
        } catch {
          // Preserve the save error; abandoned upload cleanup is best-effort.
        }
      }
      setError(err instanceof Error && err.message ? err.message : t("modal.saveFailed"));
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
                {isEdit ? t("modal.editTitle") : t("modal.addTitle")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("modal.name")}</span>
                <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("modal.namePlaceholder")} autoFocus />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("modal.indicativePrice")}</span>
                <input
                  inputMode="numeric"
                  className={inputClass}
                  value={indicativePrice}
                  onChange={(event) => setIndicativePrice(event.target.value)}
                  placeholder={t("modal.indicativePricePlaceholder")}
                  aria-invalid={parsedPrice === undefined}
                />
                <span className={parsedPrice === undefined ? "text-xs text-admin-danger" : "text-xs text-admin-muted"}>
                  {t(parsedPrice === undefined ? "modal.indicativePriceInvalid" : "modal.indicativePriceHint")}
                </span>
              </label>
              <section className="space-y-3 rounded-xl border border-admin-border bg-admin-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-admin-ink">{t("modal.image")}</p>
                    <p className="mt-1 text-xs text-admin-muted">{t("modal.imageRequirements")}</p>
                  </div>
                  <PhotoIcon aria-hidden className="size-5 text-admin-accent" />
                </div>
                {imagePreviewUrl && imageFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-admin-border bg-admin-surface p-3">
                    {/* Blob URLs are browser-local and cannot use the Next image optimizer. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreviewUrl} alt={t("modal.imagePreview", { name: imageFile.name })} className="size-20 rounded-lg object-cover" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-admin-ink">{imageFile.name}</p>
                    <Button isIconOnly size="sm" variant="ghost" aria-label={t("modal.imageRemove")} onPress={() => { setImageFile(null); setImagePreviewUrl(null); setImageError(null); }}><XMarkIcon className="size-4" /></Button>
                  </div>
                ) : (
                  <>
                    {design && (design.thumbnailUrl || design.mediaIds.length) ? (
                      <div className="flex items-center gap-3 rounded-lg border border-admin-border bg-admin-surface p-3">
                        <AdminNailDesignThumbnail imageUrl={design.thumbnailUrl} mediaId={design.mediaIds[0]} alt={t("modal.imageCurrent")} />
                        <p className="min-w-0 flex-1 text-sm text-admin-muted">{t("modal.imageCurrent")}</p>
                      </div>
                    ) : null}
                  <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-admin-border bg-admin-surface text-sm font-semibold text-admin-accent focus-within:ring-2 focus-within:ring-admin-accent">
                    <ArrowUpTrayIcon aria-hidden className="size-5" />{design?.mediaIds.length ? t("modal.imageReplace") : t("modal.imagePick")}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => { selectImage(event.target.files?.[0] ?? null); event.target.value = ""; }} />
                  </label>
                  </>
                )}
                {imageError ? <p role="alert" className="text-xs text-admin-danger">{imageError}</p> : null}
              </section>
              <div className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("statusLabel")}</span>
                <AdminSelectField
                  label={t("modal.statusLabel")}
                  fullWidth
                  value={status}
                  onChange={setStatus}
                  options={statusOptions.map((code) => ({ value: code, label: statusLabel(code) }))}
                />
              </div>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>{t("modal.cancel")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
                {busy ? t("modal.saving") : isEdit ? t("modal.save") : t("modal.add")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
