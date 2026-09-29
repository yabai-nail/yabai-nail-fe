import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AppointmentAddonPicker, type AppointmentAddonSummary } from "@/components/pages/admin/AdminAppointments/AppointmentAddonPicker";
import { formatMoney } from "@/lib/admin-format";
import { useAdminServiceAddons, type AdminServiceAddonConfiguration } from "@/service";
import type { PaymentLineItem, PaymentServiceSnapshot } from "./data";

export function selectedCheckoutAddons(
  configuration: AdminServiceAddonConfiguration | undefined,
  branchId: string,
  selectedIds: ReadonlyArray<string>,
): ReadonlyArray<PaymentLineItem> {
  const selected = new Set(selectedIds);
  return configuration?.groups.flatMap((group) => group.items.flatMap((item) => {
    const branch = item.branches.find((candidate) => candidate.branchId === branchId);
    if (!selected.has(item.addonServiceId) || !item.addon.active || branch?.enabled === false) return [];
    return [{
      id: item.addonServiceId,
      name: item.addon.name,
      price: item.addon.representsNoSelection ? 0 : branch?.priceOverride ?? item.addon.price,
      note: "",
      source: "catalog" as const,
    }];
  })) ?? [];
}

export function ServiceSelectionModal({ currentId, currentAddonIds, branchId, services, onClose, onSelect }: Readonly<{
  currentId: string;
  currentAddonIds: ReadonlyArray<string>;
  branchId: string;
  services: ReadonlyArray<PaymentServiceSnapshot>;
  onClose: () => void;
  onSelect: (service: PaymentServiceSnapshot, additionalItems: ReadonlyArray<PaymentLineItem>) => Promise<string | null>;
}>) {
  const t = useTranslations("admin.payments");
  const [selectedService, setSelectedService] = useState<PaymentServiceSnapshot | null>(null);
  const [addonSummary, setAddonSummary] = useState<AppointmentAddonSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addonConfiguration = useAdminServiceAddons(selectedService?.id ?? null);

  function chooseCandidate(service: PaymentServiceSnapshot) {
    setSelectedService(service);
    setAddonSummary(null);
    setError(null);
  }

  async function submit() {
    if (!selectedService || !addonSummary?.complete || !addonConfiguration.data) return;
    setBusy(true);
    setError(null);
    const nextError = await onSelect(
      selectedService,
      selectedCheckoutAddons(addonConfiguration.data, branchId, addonSummary.ids),
    );
    setBusy(false);
    if (nextError) setError(nextError);
    else onClose();
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop><Modal.Container size="md" placement="center" scroll="inside"><Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
        <Modal.CloseTrigger className="rounded-lg" />
        <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4"><span className="grid size-9 place-items-center rounded-lg bg-admin-soft text-admin-accent"><ArrowPathIcon className="size-5" /></span><div><Modal.Heading className="text-lg font-bold text-admin-ink">{t("selection.title")}</Modal.Heading><p className="text-xs text-admin-muted">{t("selection.subtitle")}</p></div></Modal.Header>
        <Modal.Body className="space-y-3 px-5 py-5">
          {services.map((service) => <Button key={service.id} variant={service.id === (selectedService?.id ?? currentId) ? "primary" : "outline"} className="h-auto w-full justify-between rounded-lg border-admin-border px-4 py-3" onPress={() => chooseCandidate(service)}><span className="text-left"><span className="block font-semibold">{service.name}</span><span className="block text-xs opacity-75">{formatMoney(service.price)}</span></span>{service.id === currentId ? t("selection.current") : t("selection.pick")}</Button>)}
          {selectedService ? <AppointmentAddonPicker key={selectedService.id} serviceId={selectedService.id} branchId={branchId} initialIds={selectedService.id === currentId ? currentAddonIds : []} onChange={setAddonSummary} /> : null}
          {error ? <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">{error}</p> : null}
        </Modal.Body>
        <Modal.Footer className="border-t border-admin-border px-5 py-4"><Button variant="outline" className="rounded-lg border-admin-border" isDisabled={busy} onPress={onClose}>{t("selection.close")}</Button>{selectedService ? <Button variant="primary" className="rounded-lg" isDisabled={busy || !addonSummary?.complete || !addonConfiguration.data} onPress={() => void submit()}>{busy ? t("summary.saving") : t("selection.save")}</Button> : null}</Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  );
}
