"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { adminMediaService, adminService, useAdminServiceCategories } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import { validateServiceImage } from "./service-image";
import { ServiceVisibilityFields } from "./ServiceVisibilityFields";

// Service creation is org-level (no branchId in the path). The category is required by the
// API, not merely by this form: the column is NOT NULL, so a service with no category cannot
// exist. Photos are uploaded first and attached by media id; the backend alone turns that private
// upload into a stable public service-photo URL.
export function ServiceCreateModal({
  onClose,
  onCreated,
}: Readonly<{
  onClose: () => void;
  onCreated: () => void;
}>) {
  const t = useTranslations("admin.services");
  const locale = useLocale();
  const categories = useAdminServiceCategories();
  const categoryItems = categories.data?.items ?? [];
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = Number(price.replace(/\D/g, ""));
  const durationNum = Number(duration);
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const canSubmit =
    name.trim().length >= 2 &&
    categoryId !== "" &&
    priceNum > 0 &&
    durationNum > 0 &&
    durationNum % 15 === 0 &&
    !imageError &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    let uploadedMediaId: string | null = null;
    try {
      if (imageFile) uploadedMediaId = await adminMediaService.uploadFile(imageFile);
      await adminService.createService({
        name: name.trim(),
        categoryId,
        price: priceNum,
        durationMinutes: durationNum,
        ...(uploadedMediaId ? { imageMediaId: uploadedMediaId } : {}),
        status: isVisible ? "ACTIVE" : "INACTIVE",
        isFeatured,
      });
      notifySuccess(t("create.success"));
      onCreated();
      onClose();
    } catch (err) {
      if (uploadedMediaId) {
        try {
          await adminMediaService.deleteMedia(uploadedMediaId);
        } catch {
          // Keep the actionable create error visible; cleanup is best-effort here.
        }
      }
      setError(err instanceof Error && err.message ? err.message : t("create.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("create.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-5 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("create.name")}</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("create.namePlaceholder")}
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("form.category")}</span>
                <select
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">{t("form.categoryPlaceholder")}</option>
                  {categoryItems.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nameVi ?? category.name}
                    </option>
                  ))}
                </select>
                {categories.isLoading ? (
                  <span className="text-xs text-admin-muted">{t("form.categoriesLoading")}</span>
                ) : categoryItems.length === 0 ? (
                  <span role="alert" className="text-xs text-admin-danger">
                    {t("form.categoriesEmpty")}
                  </span>
                ) : null}
              </label>
              <div className="contents">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("create.price")}</span>
                  <input
                    inputMode="numeric"
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="6600"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("create.duration")}</span>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                  />
                </label>
              </div>
              </div>
              <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-soft p-4 text-sm">
                <h3 className="font-semibold text-admin-ink">{t("image.title")} <span className="font-normal text-admin-muted">{t("image.optional")}</span></h3>
                {imagePreviewUrl && imageFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-admin-border bg-admin-surface p-3">
                    {/* A blob URL is browser-local and must bypass Next's server image optimizer. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreviewUrl}
                      alt={t("image.previewAlt", { name: imageFile.name })}
                      className="size-20 shrink-0 rounded-lg border border-admin-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-admin-ink">{imageFile.name}</p>
                      <p className="mt-1 text-xs text-admin-muted">
                        {new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(imageFile.size / 1_000_000)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={t("image.removeSelected")}
                      className="rounded-lg p-2 text-admin-muted hover:bg-admin-surface hover:text-admin-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreviewUrl(null);
                        setImageError(null);
                      }}
                      disabled={busy}
                    >
                      <XMarkIcon aria-hidden className="size-5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-admin-border bg-admin-surface px-4 py-5 text-center transition-colors hover:border-admin-accent focus-within:ring-2 focus-within:ring-admin-accent">
                    <span className="flex size-10 items-center justify-center rounded-full bg-admin-surface text-admin-accent">
                      <PhotoIcon aria-hidden className="size-5" />
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-admin-ink">
                      <ArrowUpTrayIcon aria-hidden className="size-4" /> {t("image.pick")}
                    </span>
                    <span className="text-xs text-admin-muted">{t("image.requirements")}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={busy}
                      onChange={(event) => {
                        const selected = event.target.files?.[0] ?? null;
                        event.target.value = "";
                        if (!selected) return;
                        const validationError = validateServiceImage(selected);
                        setImageError(validationError);
                        setImageFile(validationError ? null : selected);
                        setImagePreviewUrl(validationError ? null : URL.createObjectURL(selected));
                      }}
                    />
                  </label>
                )}
                {imageError ? <span role="alert" className="text-xs text-admin-danger">{t(`image.errors.${imageError}`)}</span> : null}
              </section>
              <ServiceVisibilityFields
                busy={busy}
                isFeatured={isFeatured}
                isVisible={isVisible}
                onFeaturedChange={setIsFeatured}
                onVisibleChange={setIsVisible}
              />
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("create.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canSubmit}
                onPress={() => void submit()}
              >
                {busy ? (imageFile ? t("image.uploading") : t("create.saving")) : t("create.submit")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
