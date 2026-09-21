"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

import { adminMediaService, adminService, useAdminBranchList, useAdminServiceCategories, useAdminServices, type AdminServiceItem } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import { validateServiceImage } from "./service-image";
import { NO_ADDON_GROUPS, ServiceAddonFields, useAddonDrafts } from "./ServiceAddonFields";
import { ServiceVisibilityFields } from "./ServiceVisibilityFields";
import { isValidServiceAmount, parseCatalogInteger } from "./service-numbers";

// Service creation is org-level (no branchId in the path). The category is required by the
// API, not merely by this form: the column is NOT NULL, so a service with no category cannot
// exist. Photos are uploaded first and attached by media id; the backend alone turns that private
// upload into a stable public service-photo URL.
export function ServiceCreateModal({
  lockedServiceType,
  onClose,
  onCreated,
}: Readonly<{
  /** Preset and hide the type control, for a tab that only creates one kind. */
  lockedServiceType?: "ADD_ON";
  onClose: () => void;
  onCreated: () => void;
}>) {
  const t = useTranslations("admin.services");
  const tAddons = useTranslations("admin.services.addons");
  const locale = useLocale();
  const categories = useAdminServiceCategories();
  const categoryItems = categories.data?.items ?? [];
  const [name, setName] = useState("");
  const [nameJa, setNameJa] = useState("");
  const [serviceType, setServiceType] = useState<"BASE" | "ADD_ON">(lockedServiceType ?? "BASE");
  const [addonGroup, setAddonGroup] = useState("NAIL_REMOVAL");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [warrantyDays, setWarrantyDays] = useState("0");
  const [description, setDescription] = useState("");
  const [bookableStandalone, setBookableStandalone] = useState(false);
  const [representsNoSelection, setRepresentsNoSelection] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The per-service add-on endpoint needs a service that exists, so the catalogue and the
  // branch list are read from the org-level lists instead. The services list is not filtered
  // by type server-side, which is why the add-ons are picked out here.
  const addonServices = useAdminServices();
  const branchList = useAdminBranchList();
  const addonCatalog = useMemo(
    () => (addonServices.data?.items ?? []).filter((service) => service.serviceType === "ADD_ON"),
    [addonServices.data],
  );
  const branches = useMemo(() => branchList.data?.items ?? [], [branchList.data]);
  const addons = useAddonDrafts({ addonCatalog, branches, groups: NO_ADDON_GROUPS });
  // Set once the POST has succeeded but the add-on PUT has not. The service exists from then
  // on, so pressing Create again would make a duplicate; the form retries only the add-on
  // step against this service instead.
  const [created, setCreated] = useState<AdminServiceItem | null>(null);

  const priceNum = parseCatalogInteger(price);
  const durationNum = parseCatalogInteger(duration);
  const warrantyDaysNum = Number(warrantyDays);
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const canSubmit =
    name.trim().length >= 2 &&
    (serviceType === "ADD_ON" || categoryId !== "") &&
    (serviceType === "BASE" || addonGroup.trim().length >= 2) &&
    isValidServiceAmount(priceNum, serviceType) &&
    isValidServiceAmount(durationNum, serviceType) &&
    Number.isInteger(warrantyDaysNum) && warrantyDaysNum >= 0 && warrantyDaysNum <= 3650 &&
    !imageError &&
    // A branch override the backend would refuse must stop the submit here: past this point
    // the service is already created, so the refusal would arrive too late to undo.
    addons.overrideProblems.length === 0 &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    let uploadedMediaId: string | null = null;
    try {
      if (imageFile) uploadedMediaId = await adminMediaService.uploadFile(imageFile);
      const service = await adminService.createService({
        name: name.trim(),
        nameJa: nameJa.trim() || undefined,
        description: description.trim(),
        bookableStandalone: serviceType === "ADD_ON" && bookableStandalone,
        serviceType,
        addonGroup: serviceType === "ADD_ON" ? addonGroup.trim().toUpperCase() : null,
        ...(serviceType === "BASE" ? { categoryId } : {}),
        price: priceNum!,
        durationMinutes: durationNum!,
        warrantyDays: warrantyDaysNum,
        ...(uploadedMediaId ? { imageMediaId: uploadedMediaId } : {}),
        status: isVisible ? "ACTIVE" : "INACTIVE",
        isFeatured: serviceType === "BASE" && isFeatured,
        representsNoSelection: serviceType === "ADD_ON" && representsNoSelection,
      });
      // Refresh the list before the add-on step: the service is already real, and it has to
      // be visible behind the modal even if what follows fails.
      onCreated();
      if (serviceType === "BASE" && addons.groups.length > 0) {
        try {
          await adminService.updateServiceAddons(service.id, { groups: addons.groups }, service.version);
        } catch (addonError) {
          setCreated(service);
          setError(addonError instanceof Error && addonError.message ? addonError.message : t("create.addonsFailed"));
          return;
        }
      }
      notifySuccess(t("create.success"));
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

  const retryAddons = async () => {
    if (!created) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.updateServiceAddons(created.id, { groups: addons.groups }, created.version);
      notifySuccess(t("create.success"));
      onCreated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t("create.addonsFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          {/* Same width as the edit modal, and for the same reason: HeroUI's largest named
              size is --container-lg, 32rem, and the add-on section below needs more than
              that before its per-branch columns stop being unreadable. */}
          <Modal.Dialog className="max-w-4xl">
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{lockedServiceType ? t("addonsTab.createTitle") : t("create.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-5 px-6 py-5">
              {/* Once the service has been created these fields no longer have anywhere to
                  save to, so a native disabled fieldset freezes them in one place rather than
                  per control. `contents` leaves the body grid exactly as it was. */}
              <fieldset disabled={Boolean(created)} className="contents">
              <div className="grid gap-4 sm:grid-cols-2">
              {lockedServiceType ? null : (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("form.serviceType")}</span>
                  <select className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink" value={serviceType} onChange={(event) => { const next = event.target.value as "BASE" | "ADD_ON"; setServiceType(next); if (next === "ADD_ON") setIsFeatured(false); }}>
                    <option value="BASE">{t("form.baseService")}</option>
                    <option value="ADD_ON">{t("form.addonService")}</option>
                  </select>
                </label>
              )}
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
                <span className="font-semibold text-admin-ink">{t("form.nameJa")}</span>
                <input className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink" value={nameJa} onChange={(event) => setNameJa(event.target.value)} />
              </label>
              {serviceType === "ADD_ON" ? (
                <label className="flex flex-col gap-2 text-sm sm:col-span-2">
                  <span className="font-semibold text-admin-ink">{t("form.addonGroup")}</span>
                  <input className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 uppercase text-admin-ink" value={addonGroup} onChange={(event) => setAddonGroup(event.target.value)} placeholder="NAIL_REMOVAL" />
                </label>
              ) : null}
              {serviceType === "BASE" ? (
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
              ) : null}
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
                  {addonServices.isLoading || branchList.isLoading ? (
                    <p className="text-sm text-admin-muted">{tAddons("loading")}</p>
                  ) : addonServices.error || branchList.error ? (
                    <p role="alert" className="text-sm text-admin-danger">{tAddons("loadFailed")}</p>
                  ) : addonCatalog.length === 0 ? (
                    <p className="rounded-xl border border-admin-border p-4 text-sm text-admin-muted">{tAddons("empty")}</p>
                  ) : (
                    <ServiceAddonFields
                      addonCatalog={addonCatalog}
                      branches={branches}
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
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{created ? t("create.close") : t("create.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={created ? busy : !canSubmit}
                onPress={() => void (created ? retryAddons() : submit())}
              >
                {busy
                  ? (imageFile && !created ? t("image.uploading") : t("create.saving"))
                  : created ? t("create.saveAddons") : t("create.submit")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
