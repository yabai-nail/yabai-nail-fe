import { CheckCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatMoney } from "@/lib/admin-format";
import { paymentMethodLabel, type CheckoutInvoice } from "./data";
import { calculateAmountReceivedState, calculateCashTenderState, type PaymentTotals } from "./payment-state";

/** One receipt line: the label on the left, the value right-aligned so the figures stack. */
function ReceiptRow({ label, children, emphasis = false }: Readonly<{ label: string; children: ReactNode; emphasis?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-admin-muted">{label}</dt>
      <dd className={emphasis ? "text-lg font-bold tabular-nums text-admin-accent" : "font-semibold tabular-nums text-admin-ink"}>{children}</dd>
    </div>
  );
}

export function PaymentConfirmationDialog({ invoice, totals, cashTendered, amountReceived, isServerBacked, onClose, onConfirm }: Readonly<{
  invoice: CheckoutInvoice;
  totals: PaymentTotals;
  cashTendered: string;
  amountReceived: string;
  isServerBacked: boolean;
  onClose: () => void;
  onConfirm: (receivedAmount: number | null) => void;
}>) {
  const t = useTranslations("admin.payments");
  const tMethod = useTranslations("admin.paymentMethod");
  const isCash = invoice.paymentMethod === "cash";
  const cash = isCash ? calculateCashTenderState(totals.grandTotal, cashTendered) : { cashTendered: null, cashChange: null, error: null };
  const electronic = !isCash && invoice.paymentMethod
    ? calculateAmountReceivedState(totals.grandTotal, amountReceived)
    : { amountReceived: null, error: null };

  return (
    <AlertDialog isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container size="sm" placement="center">
          <AlertDialog.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <AlertDialog.Header className="flex flex-row items-center gap-3 px-5 pt-5">
              <AlertDialog.Icon status="success"><CheckCircleIcon className="size-5" /></AlertDialog.Icon>
              <AlertDialog.Heading className="text-lg font-bold text-admin-ink">{t("confirm.title")}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="space-y-4 px-5 py-4 text-sm">
              {/* The amount is what the cashier checks first, so it leads, large, on its own line. */}
              <div className="rounded-xl bg-admin-soft px-4 py-3">
                <p className="text-xs font-semibold text-admin-muted">{t("confirm.amount")}</p>
                <p className="text-3xl font-extrabold tabular-nums text-admin-ink">{formatMoney(totals.grandTotal)}</p>
              </div>
              <dl className="space-y-2">
                <ReceiptRow label={t("confirm.customer")}>{invoice.customer.name}</ReceiptRow>
                <ReceiptRow label={t("confirm.method")}>
                  {invoice.paymentMethod ? paymentMethodLabel(invoice.paymentMethod, tMethod) : t("invoice.methodNotChosen")}
                </ReceiptRow>
                {isCash && totals.grandTotal > 0 ? (
                  <>
                    <div className="border-t border-dashed border-admin-border" />
                    <ReceiptRow label={t("confirm.tenderedLabel")}>{formatMoney(cash.cashTendered ?? 0)}</ReceiptRow>
                    <ReceiptRow label={t("confirm.cashChangeLabel")} emphasis>{formatMoney(cash.cashChange ?? 0)}</ReceiptRow>
                  </>
                ) : null}
                {!isCash && invoice.paymentMethod && totals.grandTotal > 0 ? (
                  <>
                    <div className="border-t border-dashed border-admin-border" />
                    <ReceiptRow label={t("confirm.amountReceivedResult")}>{formatMoney(electronic.amountReceived ?? 0)}</ReceiptRow>
                  </>
                ) : null}
              </dl>
              <p className="flex gap-2 text-xs leading-5 text-admin-muted">
                <InformationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {isServerBacked ? t("confirm.serverNote") : t("confirm.localNote")}
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="grid grid-cols-2 gap-2 border-t border-admin-border px-5 py-4">
              <Button variant="outline" className="w-full rounded-lg border-admin-border" onPress={onClose}>{t("confirm.recheck")}</Button>
              <Button variant="primary" className="w-full rounded-lg" isDisabled={Boolean(cash.error || electronic.error)} onPress={() => onConfirm(isCash ? cash.cashTendered : electronic.amountReceived)}>{t("confirm.submit")}</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
