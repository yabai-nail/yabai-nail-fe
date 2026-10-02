"use client";

import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useBranchServiceAddons, useBranchServices, type BranchServiceAddonGroup } from "@/service";
import type { Appointment } from "./data";

function minimumSelections(group: BranchServiceAddonGroup): number {
  return group.required ? Math.max(1, group.minSelections) : group.minSelections;
}

export function toggleActualAddon(group: BranchServiceAddonGroup, serviceId: string, current: ReadonlySet<string>): ReadonlySet<string> {
  const next = new Set(current);
  const options = group.options.filter((option) => option.serviceId && option.available);
  const clicked = options.find((option) => option.serviceId === serviceId);
  if (!clicked) return next;
  const groupIds = options.map((option) => option.serviceId!);
  if (next.has(serviceId)) {
    next.delete(serviceId);
    return next;
  }
  if (group.selectionMode === "SINGLE" || clicked.representsNoSelection) {
    groupIds.forEach((id) => next.delete(id));
  } else {
    options.filter((option) => option.representsNoSelection).forEach((option) => next.delete(option.serviceId!));
    if (group.maxSelections && groupIds.filter((id) => next.has(id)).length >= group.maxSelections) return next;
  }
  next.add(serviceId);
  return next;
}

export function validActualAddons(groups: ReadonlyArray<BranchServiceAddonGroup>, selected: ReadonlySet<string>): boolean {
  return groups.every((group) => {
    const count = group.options.filter((option) => option.serviceId && option.available && selected.has(option.serviceId)).length;
    return count >= minimumSelections(group) && (!group.maxSelections || count <= group.maxSelections);
  });
}

export function actualServiceIds(baseServiceId: string, groups: ReadonlyArray<BranchServiceAddonGroup>, selected: ReadonlySet<string>): ReadonlyArray<string> {
  return [baseServiceId, ...groups.flatMap((group) => group.options.flatMap((option) =>
    option.serviceId && option.available && selected.has(option.serviceId) ? [option.serviceId] : [],
  ))];
}

export function ActualServicesModal({ branchId, appointment, onClose, onConfirm, submitting = false, error = null }: Readonly<{
  branchId: string;
  appointment: Appointment;
  onClose: () => void;
  onConfirm: (serviceIds: ReadonlyArray<string>) => void;
  submitting?: boolean;
  error?: string | null;
}>) {
  const t = useTranslations("admin.appointments");
  const servicesQuery = useBranchServices(branchId);
  const services = servicesQuery.data?.items ?? [];
  const [baseServiceId, setBaseServiceId] = useState(appointment.service.id);
  const [selectedAddons, setSelectedAddons] = useState<ReadonlySet<string>>(() => new Set(
    (appointment.services?.map((service) => service.id) ?? appointment.addonIds ?? []).filter((id) => id !== appointment.service.id),
  ));
  const addonsQuery = useBranchServiceAddons(branchId, baseServiceId);
  const groups = useMemo(() => addonsQuery.data?.groups ?? [], [addonsQuery.data?.groups]);
  const selectionValid = Boolean(addonsQuery.data)
    && services.some((service) => service.id === baseServiceId)
    && validActualAddons(groups, selectedAddons);
  const isLoading = servicesQuery.isLoading || addonsQuery.isLoading;
  const loadError = servicesQuery.error || addonsQuery.error;

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4">
              <WrenchScrewdriverIcon className="size-5 text-admin-accent" />
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("actualServices.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-4 text-sm">
              <p className="text-xs text-admin-muted">{t("actualServices.description")}</p>
              {isLoading ? (
                <p className="text-xs text-admin-muted">{t("actualServices.loading")}</p>
              ) : loadError ? (
                <p role="alert" className="text-xs text-admin-danger">{t("actualServices.loadFailed")}</p>
              ) : services.length === 0 ? (
                <p className="text-xs text-admin-muted">{t("actualServices.empty")}</p>
              ) : (
                <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-admin-border p-3">
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-admin-muted">{t("actualServices.baseService")}</legend>
                    <ul className="space-y-1">{services.map((service) => <li key={service.id}>
                      <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-admin-soft">
                        <input type="radio" name="actual-base-service" className="accent-admin-accent" checked={baseServiceId === service.id} onChange={() => { setBaseServiceId(service.id); setSelectedAddons(new Set()); }} />
                        <span className="flex-1 truncate text-sm text-admin-ink">{service.name}</span>
                        {service.durationMinutes ? <span className="text-[0.65rem] text-admin-muted">{t("actualServices.duration", { minutes: service.durationMinutes })}</span> : null}
                      </label>
                    </li>)}</ul>
                  </fieldset>
                  {groups.map((group) => {
                    const options = group.options.filter((option) => option.serviceId);
                    if (!options.length && minimumSelections(group) === 0) return null;
                    return <fieldset key={group.code} className="border-t border-admin-border pt-3">
                      <legend className="px-1 text-xs font-semibold text-admin-muted">{group.nameVi || group.nameJa || group.code}{minimumSelections(group) ? " *" : ""}</legend>
                      <ul className="mt-2 space-y-1">{options.map((option) => <li key={option.id}>
                        <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-admin-soft">
                          <input type="checkbox" className="accent-admin-accent" checked={selectedAddons.has(option.serviceId!)} disabled={!option.available} onChange={() => setSelectedAddons((current) => toggleActualAddon(group, option.serviceId!, current))} />
                          <span className="flex-1 truncate text-sm text-admin-ink">{option.name}</span>
                          <span className="text-[0.65rem] text-admin-muted">{t("actualServices.duration", { minutes: option.durationMinutes })}</span>
                        </label>
                      </li>)}</ul>
                    </fieldset>;
                  })}
                  {!selectionValid ? <p role="alert" className="text-xs text-admin-danger">{t("actualServices.incomplete")}</p> : null}
                </div>
              )}
              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="border-t border-admin-border px-5 py-4">
              <Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose} isDisabled={submitting}>{t("actualServices.close")}</Button>
              <Button variant="primary" className="rounded-lg" onPress={() => onConfirm(actualServiceIds(baseServiceId, groups, selectedAddons))} isDisabled={submitting || isLoading || Boolean(loadError) || !selectionValid}>
                {submitting ? t("actualServices.saving") : t("actualServices.submit")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
