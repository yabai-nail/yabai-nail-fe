import { CheckIcon, PrinterIcon, StarIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { formatMoney } from "@/lib/admin-format";
import type { CheckoutInvoice } from "./data";
import { calculatePointRedemptionState, type PaymentTotals } from "./payment-state";

const fieldClassName = "min-h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:bg-admin-canvas disabled:text-admin-muted";

export function validatePaymentAdjustmentDraft(
  subtotal: number,
  benefitDiscount: number,
  manualDiscount: string,
  discountReason: string,
  checkoutNote: string,
) {
  const value = Number(manualDiscount);
  if (!Number.isSafeInteger(value) || value < 0 || value > subtotal - benefitDiscount) return { ok: false, error: "state.discountRange" } as const;
  if (value > 0 && discountReason.trim().length < 2) return { ok: false, error: "summary.discountReasonRequired" } as const;
  if (discountReason.trim().length > 120) return { ok: false, error: "state.discountInvalid" } as const;
  return { ok: true, value, discountReason: discountReason.trim(), checkoutNote: checkoutNote.trim() } as const;
}

export function PaymentSummaryPanel({ invoice, totals, canAdjust, canUsePoints, canConfirmPayment, canCreateReview, onSaveAdjustments, onConfirm, onDraftDiscountChange, onDraftPointsChange, onPreview, onReview }: Readonly<{
  invoice: CheckoutInvoice;
  totals: PaymentTotals;
  canAdjust: boolean;
  canUsePoints: boolean;
  canConfirmPayment: boolean;
  canCreateReview: boolean;
  onSaveAdjustments: (manualDiscount: number, discountReason: string, checkoutNote: string) => Promise<string | null>;
  onConfirm: (manualDiscount: number, discountReason: string, checkoutNote: string, pointsRequested: number) => Promise<string | null>;
  onDraftDiscountChange: (manualDiscount: number | null) => void;
  onDraftPointsChange: (pointsRequested: number) => void;
  onPreview: () => void;
  onReview: () => void;
}>) {
  const t = useTranslations("admin.payments");
  const format = useFormatter();
  const [manualDiscount, setManualDiscount] = useState(String(invoice.manualDiscount));
  const [discountReason, setDiscountReason] = useState(invoice.discountReason);
  const [checkoutNote, setCheckoutNote] = useState(invoice.orderNote);
  const [usePoints, setUsePoints] = useState(invoice.pointsRequested > 0);
  const [pointsRequested, setPointsRequested] = useState(invoice.pointsRequested > 0 ? String(invoice.pointsRequested) : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isPaid = invoice.status === "paid";
  const nonPointBenefitDiscount = Math.max(0, invoice.benefitDiscount - invoice.pointsRequested);
  const parsedManualDiscount = Number(manualDiscount);
  const pointLimit = isPaid
    ? invoice.pointsRequested
    : calculatePointRedemptionState(
      totals.subtotal,
      nonPointBenefitDiscount,
      Number.isSafeInteger(parsedManualDiscount) && parsedManualDiscount >= 0 ? parsedManualDiscount : invoice.manualDiscount,
      invoice.customer.pointBalance,
      "0",
    ).maximumPoints;
  const pointsDisabled = isPaid || !canUsePoints || busy || pointLimit === 0;

  function pointDraft(manualDiscountValue: number) {
    if (!usePoints) return { pointsRequested: 0, maximumPoints: 0, error: null } as const;
    return calculatePointRedemptionState(totals.subtotal, nonPointBenefitDiscount, manualDiscountValue, invoice.customer.pointBalance, pointsRequested);
  }

  function draft() {
    const adjustment = validatePaymentAdjustmentDraft(totals.subtotal, invoice.benefitDiscount, manualDiscount, discountReason, checkoutNote);
    if (!adjustment.ok) return adjustment;
    const points = pointDraft(adjustment.value);
    if (points.error || points.pointsRequested === null) return { ok: false, error: points.error ?? "state.pointsInvalid" } as const;
    return { ...adjustment, pointsRequested: points.pointsRequested } as const;
  }

  async function submit(confirm: boolean) {
    const next = draft();
    if (!next.ok) return setError(t(next.error));
    setBusy(true);
    setError("");
    const nextError = confirm
      ? await onConfirm(next.value, next.discountReason, next.checkoutNote, next.pointsRequested)
      : await onSaveAdjustments(next.value, next.discountReason, next.checkoutNote);
    setBusy(false);
    if (nextError) setError(nextError);
  }

  return <Card className="h-fit gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none lg:col-span-2 xl:col-span-1"><Card.Header className="flex flex-row items-center justify-between border-b border-admin-border px-4 py-3"><h2 className="font-bold text-admin-ink">{t("summary.heading")}</h2><Chip size="sm" variant="soft" color={isPaid ? "success" : "warning"}><Chip.Label>{isPaid ? t("summary.paid") : t("summary.pending")}</Chip.Label></Chip></Card.Header><Card.Content className="space-y-5 px-4 py-4">
    <dl className="space-y-3 text-sm"><SummaryRow label={t("summary.subtotal")} value={formatMoney(totals.subtotal)} />{nonPointBenefitDiscount > 0 ? <SummaryRow label={t("summary.benefitDiscount")} value={`-${formatMoney(nonPointBenefitDiscount)}`} /> : null}{invoice.pointsRequested > 0 ? <SummaryRow label={t("summary.pointsDiscount")} value={`-${formatMoney(invoice.pointsRequested)}`} /> : null}<div><label htmlFor="payment-discount" className="mb-2 block text-xs font-semibold text-admin-ink">{t("summary.discount")}</label><input id="payment-discount" className={fieldClassName} type="number" min="0" max={Math.max(0, totals.subtotal - invoice.benefitDiscount)} step="1" value={manualDiscount} disabled={isPaid || !canAdjust || busy} onChange={(event) => { const value = event.target.value; setManualDiscount(value); const parsed = Number(value); onDraftDiscountChange(Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= totals.subtotal - invoice.benefitDiscount ? parsed : null); if (Number.isSafeInteger(parsed) && parsed >= 0) { const points = pointDraft(parsed); if (!points.error && points.pointsRequested !== null) onDraftPointsChange(points.pointsRequested); } }} /></div><SummaryRow label={t("summary.grandTotal")} value={formatMoney(totals.grandTotal)} strong /></dl>
    <fieldset className="space-y-3 rounded-lg border border-admin-accent/30 bg-admin-soft p-3">
      <legend className="sr-only">{t("summary.usePoints")}</legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-2xl font-extrabold tabular-nums text-admin-accent">
          {t("summary.pointsAvailable", { points: format.number(invoice.customer.pointBalance) })}
        </p>
        <label htmlFor="use-customer-points" className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm font-semibold text-admin-ink ${pointsDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
          <input id="use-customer-points" type="checkbox" className="size-4 accent-admin-accent" checked={usePoints} disabled={pointsDisabled} onChange={(event) => { const checked = event.target.checked; setUsePoints(checked); setError(""); if (!checked) { setPointsRequested(""); onDraftPointsChange(0); } }} />
          <span>{t("summary.usePoints")}</span>
        </label>
      </div>
      {invoice.customer.pointBalance === 0 ? <p className="text-xs text-admin-muted">{t("summary.noPoints")}</p> : pointLimit === 0 && !isPaid ? <p className="text-xs text-admin-muted">{t("summary.pointsUnavailable")}</p> : null}
      {usePoints ? <label htmlFor="points-requested" className="block text-xs font-semibold text-admin-ink">{t("summary.pointsRequested")}<input id="points-requested" className={`${fieldClassName} mt-2`} type="number" min="0" max={pointLimit} step="1" value={pointsRequested} disabled={isPaid || !canUsePoints || busy} onChange={(event) => { const value = event.target.value; setPointsRequested(value); setError(""); const state = calculatePointRedemptionState(totals.subtotal, nonPointBenefitDiscount, Number(manualDiscount) || 0, invoice.customer.pointBalance, value); if (!state.error && state.pointsRequested !== null) onDraftPointsChange(state.pointsRequested); }} /><span className="mt-1 block font-normal text-admin-muted">{t("summary.pointsRule", { maximum: format.number(pointLimit) })}</span></label> : null}
    </fieldset>
    <label htmlFor="discount-reason" className="block text-xs font-semibold text-admin-ink">{t("summary.discountReason")}<input id="discount-reason" className={`${fieldClassName} mt-2`} maxLength={120} value={discountReason} disabled={isPaid || !canAdjust || busy} onChange={(event) => setDiscountReason(event.target.value)} placeholder={t("summary.discountReasonPlaceholder")} /></label>
    <label htmlFor="order-note" className="block text-xs font-semibold text-admin-ink">{t("summary.orderNote")}<textarea id="order-note" className={`${fieldClassName} mt-2 min-h-24 py-2`} maxLength={500} value={checkoutNote} disabled={isPaid || !canAdjust || busy} onChange={(event) => setCheckoutNote(event.target.value)} placeholder={t("summary.orderNotePlaceholder")} /></label>
    {!canAdjust && !isPaid ? <p className="text-xs leading-5 text-admin-muted">{t("summary.adjustmentUnavailable")}</p> : null}
    {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
    <div className="grid gap-2">{canAdjust && !isPaid ? <Button variant="outline" className="rounded-lg border-admin-border" isDisabled={busy} onPress={() => void submit(false)}>{busy ? t("summary.saving") : t("summary.saveAdjustments")}</Button> : null}<Button variant="primary" className="rounded-lg" isDisabled={!canConfirmPayment || isPaid || busy} onPress={() => void submit(true)}><CheckIcon className="size-4" />{isPaid ? t("summary.paid") : t("summary.confirm")}</Button><Button variant="outline" className="rounded-lg border-admin-border" onPress={onPreview}><PrinterIcon className="size-4" />{t("summary.preview")}</Button>{isPaid && canCreateReview ? <Button variant="outline" className="rounded-lg border-admin-border" onPress={onReview}><StarIcon className="size-4" />{t("summary.review")}</Button> : null}</div>
  </Card.Content></Card>;
}

function SummaryRow({ label, value, strong = false }: Readonly<{ label: string; value: string; strong?: boolean }>) { return <div className="flex items-center justify-between gap-3"><dt className={strong ? "font-bold text-admin-ink" : "text-admin-muted"}>{label}</dt><dd className={strong ? "text-xl font-bold text-admin-accent" : "font-semibold text-admin-ink"}>{value}</dd></div>; }
