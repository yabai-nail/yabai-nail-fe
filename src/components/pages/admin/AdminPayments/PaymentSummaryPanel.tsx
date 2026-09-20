import { CheckIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { formatMoney } from "@/lib/admin-format";
import type { CheckoutInvoice } from "./data";
import type { PaymentTotals } from "./payment-state";

const fieldClassName = "min-h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:bg-admin-canvas disabled:text-admin-muted";

export function PaymentSummaryPanel({ invoice, totals, canAdjust, canConfirmPayment, onSaveAdjustments, onConfirm, onPreview }: Readonly<{
  invoice: CheckoutInvoice;
  totals: PaymentTotals;
  canAdjust: boolean;
  canConfirmPayment: boolean;
  onSaveAdjustments: (manualDiscount: number, discountReason: string, checkoutNote: string) => Promise<string | null>;
  onConfirm: () => void;
  onPreview: () => void;
}>) {
  const t = useTranslations("admin.payments");
  const [manualDiscount, setManualDiscount] = useState(String(invoice.manualDiscount));
  const [discountReason, setDiscountReason] = useState(invoice.discountReason);
  const [checkoutNote, setCheckoutNote] = useState(invoice.orderNote);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isPaid = invoice.status === "paid";

  async function save() {
    const value = Number(manualDiscount);
    if (!Number.isSafeInteger(value) || value < 0 || value > totals.subtotal - invoice.benefitDiscount) return setError(t("state.discountRange"));
    if (value > 0 && discountReason.trim().length < 2) return setError(t("summary.discountReasonRequired"));
    setBusy(true);
    setError("");
    const nextError = await onSaveAdjustments(value, discountReason.trim(), checkoutNote.trim());
    setBusy(false);
    if (nextError) setError(nextError);
  }

  return <Card className="h-fit gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none lg:col-span-2 xl:col-span-1"><Card.Header className="flex flex-row items-center justify-between border-b border-admin-border px-4 py-3"><h2 className="font-bold text-admin-ink">{t("summary.heading")}</h2><Chip size="sm" variant="soft" color={isPaid ? "success" : "warning"}><Chip.Label>{isPaid ? t("summary.paid") : t("summary.pending")}</Chip.Label></Chip></Card.Header><Card.Content className="space-y-5 px-4 py-4">
    <dl className="space-y-3 text-sm"><SummaryRow label={t("summary.subtotal")} value={formatMoney(totals.subtotal)} />{invoice.benefitDiscount > 0 ? <SummaryRow label={t("summary.benefitDiscount")} value={`-${formatMoney(invoice.benefitDiscount)}`} /> : null}<div><label htmlFor="payment-discount" className="mb-2 block text-xs font-semibold text-admin-ink">{t("summary.discount")}</label><input id="payment-discount" className={fieldClassName} type="number" min="0" max={Math.max(0, totals.subtotal - invoice.benefitDiscount)} step="1" value={manualDiscount} disabled={isPaid || !canAdjust || busy} onChange={(event) => setManualDiscount(event.target.value)} /></div><SummaryRow label={t("summary.grandTotal")} value={formatMoney(totals.grandTotal)} strong /></dl>
    <label htmlFor="discount-reason" className="block text-xs font-semibold text-admin-ink">{t("summary.discountReason")}<input id="discount-reason" className={`${fieldClassName} mt-2`} maxLength={200} value={discountReason} disabled={isPaid || !canAdjust || busy} onChange={(event) => setDiscountReason(event.target.value)} placeholder={t("summary.discountReasonPlaceholder")} /></label>
    <label htmlFor="order-note" className="block text-xs font-semibold text-admin-ink">{t("summary.orderNote")}<textarea id="order-note" className={`${fieldClassName} mt-2 min-h-24 py-2`} maxLength={500} value={checkoutNote} disabled={isPaid || !canAdjust || busy} onChange={(event) => setCheckoutNote(event.target.value)} placeholder={t("summary.orderNotePlaceholder")} /></label>
    {!canAdjust && !isPaid ? <p className="text-xs leading-5 text-admin-muted">{t("summary.adjustmentUnavailable")}</p> : null}
    {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
    <div className="grid gap-2">{canAdjust && !isPaid ? <Button variant="outline" className="rounded-lg border-admin-border" isDisabled={busy} onPress={() => void save()}>{busy ? t("summary.saving") : t("summary.saveAdjustments")}</Button> : null}<Button variant="primary" className="rounded-lg" isDisabled={!canConfirmPayment || isPaid || busy} onPress={onConfirm}><CheckIcon className="size-4" />{isPaid ? t("summary.paid") : t("summary.confirm")}</Button><Button variant="outline" className="rounded-lg border-admin-border" onPress={onPreview}><PrinterIcon className="size-4" />{t("summary.preview")}</Button></div>
  </Card.Content></Card>;
}

function SummaryRow({ label, value, strong = false }: Readonly<{ label: string; value: string; strong?: boolean }>) { return <div className="flex items-center justify-between gap-3"><dt className={strong ? "font-bold text-admin-ink" : "text-admin-muted"}>{label}</dt><dd className={strong ? "text-xl font-bold text-admin-accent" : "font-semibold text-admin-ink"}>{value}</dd></div>; }
