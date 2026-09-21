"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, adminMediaService, adminService, useAdminServiceAddons, useAdminServiceCategories, type AdminServiceItem } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import type { SalonService } from "./data";
import { ServiceVisibilityFields } from "./ServiceVisibilityFields";
import { NO_ADDON_GROUPS, ServiceAddonFields, useAddonDrafts } from "./ServiceAddonFields";
import {
  serviceImagePatch,
  serviceMediaIdFromUrl,
  validateServiceImage,
  type ServiceImageChange,
} from "./service-image";
import { isValidServiceAmount, parseCatalogInteger } from "./service-numbers";

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
  const tAddons = useTranslations("admin.services.addons");
  const locale = useLocale();
  const categories = useAdminServiceCategories();
  const categoryItems = categories.data?.items ?? [];
  const [name, setName] = useState(service.name);
  const [nameJa, setNameJa] = useState(service.nameJa ?? "");
  const [serviceType, setServiceType] = useState<"BASE" | "ADD_ON">(service.serviceType ?? "BASE");
  const [addonGroup, setAddonGroup] = useState(service.addonGroup ?? "NAIL_REMOVAL");
  const [categoryId, setCategoryId] = useState(service.category?.id ?? "");
  const [price, setPrice] = useState(String(service.price));
  const [duration, setDuration] = useState(String(service.durationMinutes));
  const [warrantyDays, setWarrantyDays] = useState(String(service.warrantyDays ?? 0));
  const [description, setDescription] = useState(service.description ?? "");
  const [bookableStandalone, setBookableStandalone] = useState(Boolean(service.bookableStandalone));
  const [representsNoSelection, setRepresentsNoSelection] = useState(Boolean(service.representsNoSelection));
  const [imageMode, setImageMode] = useState<"keep" | "remove" | "replace">("keep");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(service.isVisible);
  const [isFeatured, setIsFeatured] = useState(Boolean(service.isFeatured));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The add-on mapping is saved by the same Save button as the rest of the form. It used to
  // have a button of its own inside the section, and pressing the footer's Save — the natural
  // "I'm done" — closed the modal and discarded every tick made below it without a word.
  const addonQuery = useAdminServiceAddons(serviceType === "BASE" ? service.id : null);
  const addonCatalog = useMemo(() => addonQuery.data?.addonCatalog ?? [], [addonQuery.data]);
  const addonBranches = useMemo(() => addonQuery.data?.branches ?? [], [addonQuery.data]);
  const addonGroups = useMemo(() => addonQuery.data?.groups ?? NO_ADDON_GROUPS, [addonQuery.data]);
  const addons = useAddonDrafts({ addonCatalog, branches: addonBranches, groups: addonGroups });
  // Set when the service itself saved but its add-ons did not: the version has moved on, so
  // the form freezes and the button retries only the add-on step against the saved service.
  const [saved, setSaved] = useState<AdminServiceItem | null>(null);

  const priceNum = parseCatalogInteger(price);
  const durationNum = parseCatalogInteger(duration);
  const warrantyDaysNum = Number(warrantyDays);
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
    isValidServiceAmount(priceNum, serviceType) &&
    isValidServiceAmount(durationNum, serviceType) &&
    Number.isInteger(warrantyDaysNum) && warrantyDaysNum >= 0 && warrantyDaysNum <= 3650 &&
    !imageError &&
    (imageMode !== "replace" || imageFile !== null) &&
    // A branch override the backend would refuse stops the whole save here, before the
    // service has already been written and the refusal would arrive half way through.
    addons.overrideProblems.length === 0 &&
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
      const updated = await adminService.updateService(
        service.id,
        {
          name: name.trim(),
          nameJa: nameJa.trim(),
          description: description.trim(),
          bookableStandalone: serviceType === "ADD_ON" && bookableStandalone,
          representsNoSelection: serviceType === "ADD_ON" && representsNoSelection,
          serviceType,
          addonGroup: serviceType === "ADD_ON" ? addonGroup.trim().toUpperCase() : null,
          ...(serviceType === "BASE" ? { categoryId } : {}),
          price: priceNum!,
          durationMinutes: durationNum!,
          warrantyDays: warrantyDaysNum,
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
      // The service is saved from here on; the list behind the modal must say so even if the
      // add-on step below fails.
      onSaved();
      // Only PUT once the add-on data has actually loaded: sending the drafts before then would
      // send an empty mapping and wipe whatever the service already had.
      if (serviceType === "BASE" && addonQuery.data) {
        try {
          const configuration = await adminService.updateServiceAddons(service.id, { groups: addons.groups }, updated.version);
          // The PUT answers with the read model as written, so it goes straight into SWR's
          // cache for this service. Without this the next open of the modal seeded its drafts
          // from the pre-save response and showed stale add-ons until a full reload.
          await addonQuery.mutate(configuration, { revalidate: false });
        } catch (addonError) {
          setSaved(updated);
          setError(addonError instanceof Error && addonError.message ? addonError.message : t("edit.addonsFailed"));
          return;
        }
      }
      notifySuccess(t("edit.success"));
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

  const retryAddons = async () => {
    if (!saved) return;
    setBusy(true);
    setError(null);
    try {
      const configuration = await adminService.updateServiceAddons(service.id, { groups: addons.groups }, saved.version);
      await addonQuery.mutate(configuration, { revalidate: false });
      notifySuccess(t("edit.success"));
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t("edit.addonsFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          {/* HeroUI's largest named size is --container-lg, 32rem. This dialog also hosts
              the add-on section, whose per-branch row is a name plus two number
              inputs, and at 32rem the name column collapsed to about a hundred pixels.
              The utilities layer wins over HeroUI's components layer, so the class
              widens the dialog without giving up the size variant's other rules. */}
          <Modal.Dialog className="max-w-4xl">
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("edit.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-5 px-6 py-5">
              {/* Once the service has saved and only its add-ons are still pending, these fields
                  have nowhere left to save to, so a native disabled fieldset freezes them in one
                  place. `contents` leaves the body grid exactly as it was. */}
              <fieldset disabled={Boolean(saved)} className="contents">
              <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("form.serviceType")}</span>
                <select disabled className="min-h-10 rounded-lg border border-admin-border bg-admin-soft px-3 text-admin-muted" value={serviceType} onChange={(event) => setServiceType(event.target.value as "BASE" | "ADD_ON")}>
                  <option value="BASE">{t("form.baseService")}</option>
                  <option value="ADD_ON">{t("form.addonService")}</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("create.name")}</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
              </label>
              {serviceType === "ADD_ON" ? <label className="flex flex-col gap-2 text-sm sm:col-span-2"><span className="font-semibold text-admin-ink">{t("form.addonGroup")}</span><input className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 uppercase text-admin-ink" value={addonGroup} onChange={(event) => setAddonGroup(event.target.value)} /></label> : null}
              {serviceType === "BASE" ? <label className="flex flex-col gap-2 text-sm">
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
              </label> : null}
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
                    min={serviceType === "ADD_ON" ? 0 : 1}
                    step={1}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("form.warrantyDays")}</span>
                  <input
                    type="number"
                    min={0}
                    max={3650}
                    step={1}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={warrantyDays}
                    onChange={(event) => setWarrantyDays(event.target.value)}
                  />
                  <span className="text-xs text-admin-muted">{t("form.warrantyHint")}</span>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("form.nameJa")}</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={nameJa}
                  onChange={(event) => setNameJa(event.target.value)}
                />
              </label>
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
                <div className="grid gap-3 sm:col-span-2">
                <label className="flex items-start gap-2 text-sm">
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
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-admin-accent"
                    checked={representsNoSelection}
                    onChange={(event) => setRepresentsNoSelection(event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-admin-ink">{t("form.representsNoSelection")}</span>
                    <span className="mt-1 block text-xs text-admin-muted">{t("form.representsNoSelectionHint")}</span>
                  </span>
                </label>
                </div>
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
              </fieldset>
              {serviceType === "BASE" ? (
                <section className="grid gap-4 rounded-xl border border-admin-border p-4">
                  <div><h3 className="font-bold text-admin-ink">{tAddons("title")}</h3><p className="mt-1 text-xs text-admin-muted">{tAddons("description")}</p></div>
                  {addonQuery.isLoading ? (
                    <p className="text-sm text-admin-muted">{tAddons("loading")}</p>
                  ) : addonQuery.error ? (
                    <p role="alert" className="text-sm text-admin-danger">{tAddons("loadFailed")}</p>
                  ) : addonCatalog.length === 0 ? (
                    <p className="rounded-xl border border-admin-border p-4 text-sm text-admin-muted">{tAddons("empty")}</p>
                  ) : (
                    <ServiceAddonFields
                      addonCatalog={addonCatalog}
                      branches={addonBranches}
                      drafts={addons.drafts}
                      groupDrafts={addons.groupDrafts}
                      overrideProblems={addons.overrideProblems}
                      onToggleAddon={addons.toggleAddon}
                      onUpdateBranch={addons.updateBranch}
                      onUpdateGroupRule={addons.updateGroupRule}
                    />
                  )}
                </section>
              ) : null}
              {addons.overrideProblems.length ? <p className="text-sm text-admin-danger" role="alert">{tAddons("overridesInvalid")}</p> : null}
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{saved ? t("create.close") : t("edit.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={saved ? busy : !canSubmit}
                onPress={() => void (saved ? retryAddons() : submit())}
              >
                {busy
                  ? (imageMode === "replace" && !saved ? t("image.uploading") : t("edit.saving"))
                  : saved ? tAddons("save") : t("edit.save")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
