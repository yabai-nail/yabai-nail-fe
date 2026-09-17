"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { API_BASE_URL, adminMediaService, adminService, useAdminServiceCategories } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import type { SalonService } from "./data";
import { ServiceVisibilityFields } from "./ServiceVisibilityFields";
import { ServiceAddonConfiguration } from "./ServiceAddonConfiguration";
import {
  serviceImagePatch,
  serviceMediaIdFromUrl,
  validateServiceImage,
  type ServiceImageChange,
} from "./service-image";

// Mirror of ServiceCreateModal, plus PATCH with If-Match so we don't clobber a concurrent
// edit. Moving a service between categories happens here: the API assigns whichever category
// the body names, and a service can never be left without one.
export function ServiceEditModal({
  service,
  onClose,
  onSaved,
}: Readonly<{
  service: SalonService;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.services");
  const locale = useLocale();
  const categories = useAdminServiceCategories();
  const categoryItems = categories.data?.items ?? [];
  const [name, setName] = useState(service.name);
  const [serviceType, setServiceType] = useState<"BASE" | "ADD_ON">(service.serviceType ?? "BASE");
  const [addonGroup, setAddonGroup] = useState(service.addonGroup ?? "NAIL_REMOVAL");
  const [categoryId, setCategoryId] = useState(service.category?.id ?? "");
  const [price, setPrice] = useState(String(service.price));
  const [duration, setDuration] = useState(String(service.durationMinutes));
  const [description, setDescription] = useState(service.description ?? "");
  const [bookableStandalone, setBookableStandalone] = useState(Boolean(service.bookableStandalone));
  const [imageMode, setImageMode] = useState<"keep" | "remove" | "replace">("keep");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(service.isVisible);
  const [isFeatured, setIsFeatured] = useState(Boolean(service.isFeatured));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = Number(price.replace(/\D/g, ""));
  const durationNum = Number(duration);
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const selectImage = (selected: File | null) => {
    if (!selected) return;
    const validationError = validateServiceImage(selected);
    setImageError(validationError);
    setImageFile(validationError ? null : selected);
    setImagePreviewUrl(validationError ? null : URL.createObjectURL(selected));
    if (!validationError) setImageMode("replace");
  };

  const canSubmit =
    name.trim().length >= 2 &&
    (serviceType === "ADD_ON" || categoryId !== "") &&
    (serviceType === "BASE" || addonGroup.trim().length >= 2) &&
    priceNum > 0 &&
    durationNum > 0 &&
    durationNum % 15 === 0 &&
    !imageError &&
    (imageMode !== "replace" || imageFile !== null) &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    let uploadedMediaId: string | null = null;
    try {
      if (imageMode === "replace" && imageFile) {
        uploadedMediaId = await adminMediaService.uploadFile(imageFile);
      }
      const imageChange: ServiceImageChange = imageMode === "replace"
        ? { kind: "replace", mediaId: uploadedMediaId! }
        : { kind: imageMode };
      await adminService.updateService(
        service.id,
        {
          name: name.trim(),
          description: description.trim(),
          bookableStandalone: serviceType === "ADD_ON" && bookableStandalone,
          serviceType,
          addonGroup: serviceType === "ADD_ON" ? addonGroup.trim().toUpperCase() : null,
          ...(serviceType === "BASE" ? { categoryId } : {}),
          price: priceNum,
          durationMinutes: durationNum,
          isFeatured: serviceType === "BASE" && isFeatured,
          status: isVisible ? "ACTIVE" : "INACTIVE",
          ...serviceImagePatch(imageChange),
        },
        service.version,
      );

      if (imageMode !== "keep") {
        const previousMediaId = serviceMediaIdFromUrl(service.imageUrl, API_BASE_URL);
        if (previousMediaId) {
          try {
            await adminMediaService.deleteMedia(previousMediaId);
          } catch {
            // The service update already succeeded; orphan cleanup is best-effort.
          }
        }
      }
      notifySuccess(t("edit.success"));
      onSaved();
      onClose();
    } catch (err) {
      if (uploadedMediaId) {
        try {
          await adminMediaService.deleteMedia(uploadedMediaId);
        } catch {
          // Preserve the actionable update error; cleanup can be retried later.
        }
      }
      setError(err instanceof Error && err.message ? err.message : t("edit.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          {/* HeroUI's largest named size is --container-lg, 32rem. This dialog also hosts
              ServiceAddonConfiguration, whose per-branch row is a name plus two number
              inputs, and at 32rem the name column collapsed to about a hundred pixels.
              The utilities layer wins over HeroUI's components layer, so the class
              widens the dialog without giving up the size variant's other rules. */}
          <Modal.Dialog className="max-w-4xl">
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("edit.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-5 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("form.serviceType")}</span>
                <select disabled className="min-h-10 rounded-lg border border-admin-border bg-admin-soft px-3 text-admin-muted" value={serviceType} onChange={(event) => setServiceType(event.target.value as "BASE" | "ADD_ON")}>
                  <option value="BASE">{t("form.baseService")}</option>
                  <option value="ADD_ON">{t("form.addonService")}</option>
                </select>
              </label>
              {serviceType === "BASE" ? <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("create.name")}</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
              </label> : <label className="flex flex-col gap-2 text-sm"><span className="font-semibold text-admin-ink">{t("form.addonGroup")}</span><input className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 uppercase text-admin-ink" value={addonGroup} onChange={(event) => setAddonGroup(event.target.value)} /></label>}
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
                {categories.isLoading ? <span className="text-xs text-admin-muted">{t("form.categoriesLoading")}</span> : null}
              </label>
              <div className="contents">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("create.price")}</span>
                  <input
                    inputMode="numeric"
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
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
              <label className="flex flex-col gap-2 text-sm sm:col-span-2">
                <span className="font-semibold text-admin-ink">{t("form.description")}</span>
                <textarea
                  className="min-h-20 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink"
                  maxLength={500}
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
              {serviceType === "ADD_ON" ? (
                <label className="flex items-start gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    className="mt-1 accent-admin-accent"
                    checked={bookableStandalone}
                    onChange={(event) => setBookableStandalone(event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-admin-ink">{t("form.bookableStandalone")}</span>
                    <span className="mt-1 block text-xs text-admin-muted">{t("form.bookableStandaloneHint")}</span>
                  </span>
                </label>
              ) : null}
              </div>
              <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-soft p-4 text-sm">
                <h3 className="font-semibold text-admin-ink">{t("image.title")} <span className="font-normal text-admin-muted">{t("image.optional")}</span></h3>
                {imageMode === "replace" && imagePreviewUrl && imageFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-admin-border bg-admin-surface p-3">
                    {/* Blob URLs exist only in this browser and cannot use the Next image optimizer. */}
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
                      aria-label={t("image.removeReplacement")}
                      className="rounded-lg p-2 text-admin-muted hover:bg-admin-surface hover:text-admin-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreviewUrl(null);
                        setImageError(null);
                        setImageMode(service.imageUrl ? "keep" : "remove");
                      }}
                      disabled={busy}
                    >
                      <XMarkIcon aria-hidden className="size-5" />
                    </button>
                  </div>
                ) : imageMode === "keep" && service.imageUrl ? (
                  <div className="flex items-center gap-3 rounded-xl border border-admin-border bg-admin-surface p-3">
                    {/* The API endpoint is public so the browser can load it without auth headers. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={service.imageUrl}
                      alt={t("image.currentAlt", { name: service.name })}
                      className="size-20 shrink-0 rounded-lg border border-admin-border object-cover"
                    />
                    <p className="min-w-0 flex-1 text-xs text-admin-muted">{t("image.current")}</p>
                    <div className="flex items-center gap-1">
                      <label className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-admin-accent hover:bg-admin-surface focus-within:ring-2 focus-within:ring-admin-accent">
                        {t("image.replace")}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={busy}
                          onChange={(event) => {
                            selectImage(event.target.files?.[0] ?? null);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg text-admin-danger"
                        isDisabled={busy}
                        onPress={() => setImageMode("remove")}
                      >
                        {t("image.remove")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
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
                          selectImage(event.target.files?.[0] ?? null);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {imageMode === "remove" && service.imageUrl ? (
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-admin-danger">{t("image.removalPending")}</span>
                        <button
                          type="button"
                          className="font-semibold text-admin-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
                          onClick={() => setImageMode("keep")}
                          disabled={busy}
                        >
                          {t("image.undo")}
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
                {imageError ? <span role="alert" className="text-xs text-admin-danger">{t(`image.errors.${imageError}`)}</span> : null}
              </section>
              <ServiceVisibilityFields
                allowFeatured={serviceType === "BASE"}
                busy={busy}
                isFeatured={isFeatured}
                isVisible={isVisible}
                onFeaturedChange={setIsFeatured}
                onVisibleChange={setIsVisible}
              />
              {serviceType === "BASE" && service.version !== undefined ? <ServiceAddonConfiguration serviceId={service.id} version={service.version} /> : null}
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("edit.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canSubmit}
                onPress={() => void submit()}
              >
                {busy ? (imageMode === "replace" ? t("image.uploading") : t("edit.saving")) : t("edit.save")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
