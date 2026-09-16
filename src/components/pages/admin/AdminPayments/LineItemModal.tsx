import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import type { PaymentServiceSnapshot } from "./data";

export function LineItemModal({ services, onClose, onSubmit }: Readonly<{
  services: ReadonlyArray<PaymentServiceSnapshot>;
  onClose: () => void;
  onSubmit: (service: PaymentServiceSnapshot) => Promise<string | null>;
}>) {
  const t = useTranslations("admin.payments");
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const service = services.find((entry) => entry.id === selectedId);
    if (!service) return setError(t("state.serviceRequired"));
    setBusy(true);
    const nextError = await onSubmit(service);
    setBusy(false);
    if (nextError) setError(nextError);
  }

  return <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}><Modal.Backdrop><Modal.Container size="md" placement="center"><Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
    <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4"><span className="grid size-9 place-items-center rounded-lg bg-admin-soft text-admin-accent"><PlusIcon className="size-5" /></span><Modal.Heading className="text-lg font-bold text-admin-ink">{t("lineItem.addTitle")}</Modal.Heading></Modal.Header>
    <form onSubmit={(event) => void submit(event)}><Modal.Body className="space-y-4 px-5 py-5">
      <div className="text-sm font-semibold text-admin-ink">{t("lineItem.source")}<AdminSelectField label={t("lineItem.source")} fullWidth className="mt-2" value={selectedId} onChange={setSelectedId} options={services.map((service) => ({ value: service.id, label: service.name }))} /></div>
      <p className="text-xs leading-5 text-admin-muted">{t("lineItem.catalogOnly")}</p>
      {error ? <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">{error}</p> : null}
    </Modal.Body><Modal.Footer className="border-t border-admin-border px-5 py-4"><Button type="button" variant="outline" className="rounded-lg border-admin-border" isDisabled={busy} onPress={onClose}>{t("lineItem.close")}</Button><Button type="submit" variant="primary" className="rounded-lg" isDisabled={!selectedId || busy}>{busy ? t("summary.saving") : t("lineItem.add")}</Button></Modal.Footer></form>
  </Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>;
}
