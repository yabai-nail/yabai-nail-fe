import { ArrowLongRightIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatMoney } from "@/lib/admin-format";
import type { CheckoutInvoice, PaymentLineItem, PaymentServiceSnapshot } from "./data";
import { addLineItem, removeLineItem, replaceCurrentService, updateLineItem } from "./payment-state";
import { LineItemModal } from "./LineItemModal";
import { ServiceSelectionModal } from "./ServiceSelectionModal";

export function ServiceCheckoutPanel({ invoice, onChange, children }: Readonly<{
  invoice: CheckoutInvoice;
  onChange: (invoice: CheckoutInvoice) => void;
  children: React.ReactNode;
}>) {
  const t = useTranslations("admin.payments");
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentLineItem | null | undefined>(undefined);
  const isPaid = invoice.status === "paid";

  function chooseService(service: PaymentServiceSnapshot) {
    const result = replaceCurrentService(invoice, service);
    if (result.ok) onChange(result.value);
    setIsServiceOpen(false);
  }

  function saveItem(service: PaymentServiceSnapshot, note: string) {
    const result = editingItem
      ? updateLineItem(invoice, editingItem.id, { name: service.name, price: service.price, note })
      : addLineItem(invoice, service);
    if (!result.ok) return result.error;
    const item = result.value.additionalItems.find((entry) => entry.id === (editingItem?.id ?? service.id));
    const value = !editingItem && item && note ? { ...result.value, additionalItems: result.value.additionalItems.map((entry) => entry.id === item.id ? { ...entry, note } : entry) } : result.value;
    onChange(value);
    setEditingItem(undefined);
    return null;
  }

  return (
    <>
      <Card className="min-w-0 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="flex flex-row items-center justify-between gap-3 border-b border-admin-border px-4 py-3"><div className="flex items-center gap-2"><Step number="1" /><h2 className="font-bold text-admin-ink">{t("checkout.step1")}</h2></div><Button size="sm" variant="outline" className="rounded-lg border-admin-border" isDisabled={isPaid} onPress={() => setIsServiceOpen(true)}>{t("checkout.changeService")}</Button></Card.Header>
        <Card.Content className="p-4">
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <ServiceCard label={t("checkout.bookedService")} service={invoice.bookedService} />
            <ArrowLongRightIcon aria-hidden="true" className="mx-auto size-5 rotate-90 text-admin-muted sm:rotate-0" />
            <ServiceCard label={t("checkout.currentService")} service={invoice.currentService} isChanged={invoice.currentService.id !== invoice.bookedService.id} />
          </div>
        </Card.Content>
        <Card.Header className="flex flex-row items-center justify-between gap-3 border-y border-admin-border px-4 py-3"><div className="flex items-center gap-2"><Step number="2" /><h2 className="font-bold text-admin-ink">{t("checkout.step2")}</h2></div><Button size="sm" variant="outline" className="rounded-lg border-admin-border" isDisabled={isPaid} onPress={() => setEditingItem(null)}><PlusIcon className="size-4" />{t("checkout.addItem")}</Button></Card.Header>
        <Card.Content className="p-0">
          <ul className="divide-y divide-admin-border" aria-label={t("checkout.step2")}>
            {invoice.additionalItems.map((item) => <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_6rem_minmax(7rem,1fr)_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold text-admin-ink">{item.name}</p><p className="text-xs text-admin-muted sm:hidden">{item.note || t("checkout.noNote")}</p></div><strong className="text-sm text-admin-ink">{formatMoney(item.price)}</strong><p className="hidden truncate text-xs text-admin-muted sm:block">{item.note || t("checkout.noNote")}</p><div className="col-span-2 flex justify-end gap-1 sm:col-span-1"><Button isIconOnly size="sm" variant="ghost" isDisabled={isPaid} aria-label={t("checkout.editItem", { name: item.name })} onPress={() => setEditingItem(item)}><PencilSquareIcon className="size-4" /></Button><Button isIconOnly size="sm" variant="ghost" isDisabled={isPaid} aria-label={t("checkout.deleteItem", { name: item.name })} onPress={() => { const result = removeLineItem(invoice, item.id); if (result.ok) onChange(result.value); }}><TrashIcon className="size-4" /></Button></div></li>)}
          </ul>
        </Card.Content>
        {children}
      </Card>
      {isServiceOpen ? <ServiceSelectionModal currentId={invoice.currentService.id} onClose={() => setIsServiceOpen(false)} onSelect={chooseService} /> : null}
      {editingItem !== undefined ? <LineItemModal item={editingItem} onClose={() => setEditingItem(undefined)} onSubmit={saveItem} /> : null}
    </>
  );
}

function Step({ number }: Readonly<{ number: string }>) {
  const t = useTranslations("admin.payments");
  return <span className="grid size-6 place-items-center rounded-md border border-admin-accent text-xs font-bold text-admin-accent" aria-label={t("checkout.step", { number })}>{number}</span>;
}
function ServiceCard({ label, service, isChanged = false }: Readonly<{ label: string; service: PaymentServiceSnapshot; isChanged?: boolean }>) {
  const tCard = useTranslations("admin.payments");
  return <div className="rounded-lg border border-admin-border bg-admin-canvas p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs text-admin-muted">{label}</p>{isChanged ? <Chip size="sm" variant="soft" color="accent"><Chip.Label>{tCard("checkout.changed")}</Chip.Label></Chip> : null}</div><p className="mt-2 font-semibold text-admin-ink">{service.name}</p><p className="mt-1 font-bold text-admin-accent">{formatMoney(service.price)}</p></div>; }
