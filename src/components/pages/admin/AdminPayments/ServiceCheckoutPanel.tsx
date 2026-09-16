import { ArrowLongRightIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { formatMoney } from "@/lib/admin-format";
import type { CheckoutInvoice, PaymentServiceSnapshot } from "./data";
import { addLineItem, removeLineItem, replaceCurrentService } from "./payment-state";
import { LineItemModal } from "./LineItemModal";
import { ServiceSelectionModal } from "./ServiceSelectionModal";

export function ServiceCheckoutPanel({ invoice, services, canEdit, onSave, children }: Readonly<{
  invoice: CheckoutInvoice;
  services: ReadonlyArray<PaymentServiceSnapshot>;
  canEdit: boolean;
  onSave: (invoice: CheckoutInvoice) => Promise<string | null>;
  children: React.ReactNode;
}>) {
  const t = useTranslations("admin.payments");
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isLineItemOpen, setIsLineItemOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPaid = invoice.status === "paid";

  async function persist(next: CheckoutInvoice): Promise<string | null> {
    setBusy(true);
    setError(null);
    const nextError = await onSave(next);
    setBusy(false);
    setError(nextError);
    return nextError;
  }

  async function chooseService(service: PaymentServiceSnapshot) {
    const result = replaceCurrentService(invoice, service);
    if (!result.ok) return setError(t(result.error));
    const nextError = await persist(result.value);
    if (!nextError) setIsServiceOpen(false);
  }

  async function addService(service: PaymentServiceSnapshot) {
    const result = addLineItem(invoice, service);
    if (!result.ok) return t(result.error);
    const nextError = await persist(result.value);
    if (!nextError) setIsLineItemOpen(false);
    return nextError;
  }

  async function removeService(itemId: string) {
    const result = removeLineItem(invoice, itemId);
    if (!result.ok) return setError(t(result.error));
    await persist(result.value);
  }

  const availableAdditionalServices = services.filter((service) => service.id !== invoice.currentService.id && !invoice.additionalItems.some((item) => item.id === service.id));

  return <>
    <Card className="min-w-0 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-row items-center justify-between gap-3 border-b border-admin-border px-4 py-3"><div className="flex items-center gap-2"><Step number="1" /><h2 className="font-bold text-admin-ink">{t("checkout.step1")}</h2></div><Button size="sm" variant="outline" className="rounded-lg border-admin-border" isDisabled={!canEdit || isPaid || busy} onPress={() => setIsServiceOpen(true)}>{t("checkout.changeService")}</Button></Card.Header>
      <Card.Content className="p-4"><div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]"><ServiceCard label={t("checkout.bookedService")} service={invoice.bookedService} /><ArrowLongRightIcon aria-hidden="true" className="mx-auto size-5 rotate-90 text-admin-muted sm:rotate-0" /><ServiceCard label={t("checkout.currentService")} service={invoice.currentService} isChanged={invoice.currentService.id !== invoice.bookedService.id} /></div></Card.Content>
      <Card.Header className="flex flex-row items-center justify-between gap-3 border-y border-admin-border px-4 py-3"><div className="flex items-center gap-2"><Step number="2" /><h2 className="font-bold text-admin-ink">{t("checkout.step2")}</h2></div><Button size="sm" variant="outline" className="rounded-lg border-admin-border" isDisabled={!canEdit || isPaid || busy || availableAdditionalServices.length === 0} onPress={() => setIsLineItemOpen(true)}><PlusIcon className="size-4" />{t("checkout.addItem")}</Button></Card.Header>
      <Card.Content className="p-0"><ul className="divide-y divide-admin-border" aria-label={t("checkout.step2")}>{invoice.additionalItems.map((item) => <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3"><p className="truncate text-sm font-semibold text-admin-ink">{item.name}</p><strong className="text-sm text-admin-ink">{formatMoney(item.price)}</strong><Button isIconOnly size="sm" variant="ghost" isDisabled={!canEdit || isPaid || busy} aria-label={t("checkout.deleteItem", { name: item.name })} onPress={() => void removeService(item.id)}><TrashIcon className="size-4" /></Button></li>)}</ul>{error ? <p role="alert" className="border-t border-admin-border px-4 py-3 text-xs text-admin-danger">{error}</p> : null}</Card.Content>
      {children}
    </Card>
    {isServiceOpen ? <ServiceSelectionModal currentId={invoice.currentService.id} services={services} onClose={() => setIsServiceOpen(false)} onSelect={(service) => void chooseService(service)} /> : null}
    {isLineItemOpen ? <LineItemModal services={availableAdditionalServices} onClose={() => setIsLineItemOpen(false)} onSubmit={addService} /> : null}
  </>;
}

function Step({ number }: Readonly<{ number: string }>) { const t = useTranslations("admin.payments"); return <span className="grid size-6 place-items-center rounded-md border border-admin-accent text-xs font-bold text-admin-accent" aria-label={t("checkout.step", { number })}>{number}</span>; }
function ServiceCard({ label, service, isChanged = false }: Readonly<{ label: string; service: PaymentServiceSnapshot; isChanged?: boolean }>) { const t = useTranslations("admin.payments"); return <div className="rounded-lg border border-admin-border bg-admin-canvas p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs text-admin-muted">{label}</p>{isChanged ? <Chip size="sm" variant="soft" color="accent"><Chip.Label>{t("checkout.changed")}</Chip.Label></Chip> : null}</div><p className="mt-2 font-semibold text-admin-ink">{service.name}</p><p className="mt-1 font-bold text-admin-accent">{formatMoney(service.price)}</p></div>; }
