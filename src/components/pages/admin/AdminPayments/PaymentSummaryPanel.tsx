import { CheckIcon, PencilSquareIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatMoney } from "@/lib/admin-format";
import type { CheckoutInvoice } from "./data";
import { updateDiscount, type PaymentTotals } from "./payment-state";

const fieldClassName = "min-h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:bg-admin-canvas disabled:text-admin-muted";

export function PaymentSummaryPanel({ invoice, totals, onChange, onConfirm, onPreview }: Readonly<{
  invoice: CheckoutInvoice;
  totals: PaymentTotals;
  onChange: (invoice: CheckoutInvoice) => void;
  onConfirm: () => void;
  onPreview: () => void;
}>) {
  const t = useTranslations("admin.payments");
  const [discount, setDiscount] = useState(String(invoice.discount));
  const [error, setError] = useState("");
  const isPaid = invoice.status === "paid";

  function applyDiscount() {
    const result = updateDiscount(invoice, Number(discount));
    if (!result.ok) return setError(t(result.error));
    setError("");
    onChange(result.value);
  }

  return <Card className="h-fit gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none lg:col-span-2 xl:col-span-1"><Card.Header className="flex flex-row items-center justify-between border-b border-admin-border px-4 py-3"><h2 className="font-bold text-admin-ink">{t("summary.heading")}</h2><Chip size="sm" variant="soft" color={isPaid ? "success" : "warning"}><Chip.Label>{isPaid ? t("summary.paid") : t("summary.pending")}</Chip.Label></Chip></Card.Header><Card.Content className="space-y-5 px-4 py-4">
    <dl className="space-y-3 text-sm"><SummaryRow label={t("summary.subtotal")} value={formatMoney(totals.subtotal)} /><div><label htmlFor="payment-discount" className="mb-2 block text-xs font-semibold text-admin-ink">{t("summary.discount")}</label><div className="flex gap-2"><input id="payment-discount" className={fieldClassName} type="number" min="0" max={totals.subtotal} step="1" value={discount} disabled={isPaid} aria-invalid={Boolean(error)} aria-describedby={error ? "payment-discount-error" : undefined} onChange={(event) => setDiscount(event.target.value)} /><Button isIconOnly variant="outline" className="shrink-0 rounded-lg border-admin-border" isDisabled={isPaid} aria-label={t("summary.applyDiscount")} onPress={applyDiscount}><PencilSquareIcon className="size-4" /></Button></div>{error ? <p id="payment-discount-error" role="alert" className="mt-1 text-xs text-danger">{error}</p> : null}</div><SummaryRow label={t("summary.grandTotal")} value={formatMoney(totals.grandTotal)} strong /></dl>
    <label htmlFor="order-note" className="block text-xs font-semibold text-admin-ink">{t("summary.orderNote")}<textarea id="order-note" className={`${fieldClassName} mt-2 min-h-24 py-2`} maxLength={500} value={invoice.orderNote} onChange={(event) => onChange({ ...invoice, orderNote: event.target.value })} placeholder={t("summary.orderNotePlaceholder")} /></label>
    <div className="grid gap-2"><Button variant="primary" className="rounded-lg" isDisabled={isPaid} onPress={onConfirm}><CheckIcon className="size-4" />{isPaid ? t("summary.paid") : t("summary.confirm")}</Button><Button variant="outline" className="rounded-lg border-admin-border" onPress={onPreview}><PrinterIcon className="size-4" />{t("summary.preview")}</Button></div>
  </Card.Content></Card>;
}

function SummaryRow({ label, value, strong = false }: Readonly<{ label: string; value: string; strong?: boolean }>) { return <div className="flex items-center justify-between gap-3"><dt className={strong ? "font-bold text-admin-ink" : "text-admin-muted"}>{label}</dt><dd className={strong ? "text-xl font-bold text-admin-accent" : "font-semibold text-admin-ink"}>{value}</dd></div>; }
