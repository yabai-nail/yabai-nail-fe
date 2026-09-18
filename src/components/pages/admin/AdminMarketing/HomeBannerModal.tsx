"use client";

import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { adminMediaService } from "@/service";
import { validateServiceImage } from "../AdminServices/service-image";
import type { BannerDraft } from "./home-banners";

/**
 * The shape the API accepts for a slide's link: an https URL or an in-app path. Checked here so
 * one typo is caught in the modal rather than refusing the whole list on save.
 */
export function isBannerLink(value: string): boolean {
  const link = value.trim();
  return link === "" || /^https:\/\/\S+$/i.test(link) || /^\/\S*$/.test(link);
}

const IMAGE_ERROR_KEYS = {
  unsupportedType: "imageUnsupported",
  tooLarge: "imageTooLarge",
  empty: "imageEmpty",
} as const;

/**
 * Adds or edits one slide. The only request made here is the photo upload; the slide goes back
 * to the panel as a draft, and the panel's Save writes the whole list at once, so reordering and
 * editing several slides is one request under one version check.
 */
export function HomeBannerModal({
  banner,
  onClose,
  onDone,
}: Readonly<{
  /** The slide being edited, or null to add one. */
  banner: BannerDraft | null;
  onClose: () => void;
  onDone: (draft: BannerDraft) => void;
}>) {
  const t = useTranslations("admin.marketing.banners.modal");
  const [title, setTitle] = useState(banner?.title ?? "");
  const [link, setLink] = useState(banner?.link ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const selectImage = (selected: File | null) => {
    if (!selected) return;
    const problem = validateServiceImage(selected);
    setImageError(problem ? t(IMAGE_ERROR_KEYS[problem]) : null);
    setImageFile(problem ? null : selected);
    setImagePreviewUrl(problem ? null : URL.createObjectURL(selected));
  };

  const linkValid = isBannerLink(link);
  const hasImage = Boolean(imageFile) || Boolean(banner);
  const canSubmit = hasImage && linkValid && title.trim().length <= 80 && !imageError && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      let mediaId = banner?.mediaId ?? "";
      let imageUrl = banner?.imageUrl ?? "";
      if (imageFile) {
        mediaId = await adminMediaService.uploadFile(imageFile);
        // The API derives the public URL from the media id on save; until then the local
        // preview stands in, so the panel shows the new photo straight away.
        imageUrl = imagePreviewUrl ?? "";
      }
      onDone({
        key: banner?.key ?? mediaId,
        mediaId,
        imageUrl,
        title: title.trim() || null,
        link: link.trim() || null,
        active: banner?.active ?? true,
      });
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error && thrown.message ? thrown.message : t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const previewUrl = imagePreviewUrl ?? banner?.imageUrl ?? null;

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{banner ? t("editTitle") : t("addTitle")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-4 text-sm">
              <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-soft p-4">
                <div>
                  <p className="font-semibold text-admin-ink">{t("image")}</p>
                  <p className="mt-1 text-xs text-admin-muted">{t("imageRequirements")}</p>
                </div>
                {previewUrl ? (
                  <div className="flex items-center gap-3 rounded-xl border border-admin-border bg-admin-surface p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={imageFile ? t("imagePreview", { name: imageFile.name }) : ""}
                      className="h-20 w-36 shrink-0 rounded-lg border border-admin-border object-cover"
                    />
                    <div className="min-w-0 flex-1 truncate text-xs text-admin-muted">{imageFile?.name ?? ""}</div>
                    {imageFile ? (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={t("imageRemove")}
                        isDisabled={busy}
                        onPress={() => { setImageFile(null); setImagePreviewUrl(null); setImageError(null); }}
                      >
                        <XMarkIcon aria-hidden className="size-5" />
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-xs font-semibold text-admin-ink">
                  <ArrowUpTrayIcon aria-hidden className="size-5" />{banner || imageFile ? t("imageReplace") : t("imagePick")}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={busy}
                    onChange={(event) => { selectImage(event.target.files?.[0] ?? null); event.target.value = ""; }}
                  />
                </label>
                {imageError ? <span role="alert" className="text-xs text-admin-danger">{imageError}</span> : null}
              </section>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("title")}</span>
                <input
                  value={title}
                  maxLength={80}
                  onChange={(event) => setTitle(event.target.value)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
                <span className="text-xs text-admin-muted">{t("titleHint")}</span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("link")}</span>
                <input
                  value={link}
                  maxLength={500}
                  aria-invalid={!linkValid}
                  onChange={(event) => setLink(event.target.value)}
                  className={`min-h-10 rounded-lg border bg-admin-surface px-3 text-admin-ink ${linkValid ? "border-admin-border" : "border-admin-danger"}`}
                />
                <span className={`text-xs ${linkValid ? "text-admin-muted" : "text-admin-danger"}`}>{linkValid ? t("linkHint") : t("linkInvalid")}</span>
              </label>
              {!hasImage ? <p className="text-xs text-admin-muted">{t("imageRequired")}</p> : null}
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("cancel")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
                {busy ? t("uploading") : t("confirm")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
