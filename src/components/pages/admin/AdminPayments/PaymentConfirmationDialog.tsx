import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import { paymentMethodLabel, type CheckoutInvoice } from "./data";
import { calculateCashTenderState, type PaymentTotals } from "./payment-state";

const inputClassName = "min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

export function PaymentConfirmationDialog({ invoice, totals, cashTendered, isServerBacked, onCashTenderedChange, onClose, onConfirm }: Readonly<{
  invoice: CheckoutInvoice;
  totals: PaymentTotals;
  cashTendered: string;
  isServerBacked: boolean;
  onCashTenderedChange: (value: string) => void;
  onClose: () => void;
  onConfirm: (cashTendered: number | null) => void;
}>) {
  const t = useTranslations("admin.payments");
  const tMethod = useTranslations("admin.paymentMethod");
  const isCash = invoice.paymentMethod === "cash";
  const cash = isCash ? calculateCashTenderState(totals.grandTotal, cashTendered) : { cashTendered: null, cashChange: null, error: null };

  return (
    <AlertDialog isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container size="sm" placement="center">
          <AlertDialog.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <AlertDialog.Header className="flex flex-row items-center gap-3 px-5 pt-5">
              <AlertDialog.Icon status="success"><CheckCircleIcon className="size-5" /></AlertDialog.Icon>
              <AlertDialog.Heading className="text-lg font-bold text-admin-ink">{t("confirm.title")}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="space-y-3 px-5 py-4 text-sm text-admin-muted">
              <p>{t.rich("confirm.customer", { name: invoice.customer.name, strong: (chunks) => <strong className="text-admin-ink">{chunks}</strong> })}</p>
              <p>{t.rich("confirm.amount", { amount: formatMoney(totals.grandTotal), strong: (chunks) => <strong className="text-admin-accent">{chunks}</strong> })}</p>
              <p>{t.rich("confirm.method", { method: invoice.paymentMethod ? paymentMethodLabel(invoice.paymentMethod, tMethod) : t("invoice.methodNotChosen"), strong: (chunks) => <strong className="text-admin-ink">{chunks}</strong> })}</p>
              {isCash && totals.grandTotal > 0 ? (
                <div className="space-y-2 rounded-lg border border-admin-border bg-admin-soft p-3">
                  <label htmlFor="cash-tendered" className="block text-xs font-semibold text-admin-ink">{t("confirm.cashTendered")}</label>
                  <input
                    id="cash-tendered"
                    className={inputClassName}
                    inputMode="numeric"
                    autoComplete="off"
                    value={cashTendered}
                    onChange={(event) => onCashTenderedChange(event.target.value)}
                    aria-describedby="cash-tender-feedback"
                    aria-invalid={Boolean(cash.error)}
                    autoFocus
                  />
                  <p id="cash-tender-feedback" aria-live="polite" className={cash.error ? "text-xs text-admin-danger" : "text-xs font-semibold text-admin-accent"}>
                    {cash.error ? t(cash.error) : t("confirm.cashChange", { amount: formatMoney(cash.cashChange ?? 0) })}
                  </p>
                </div>
              ) : null}
              <p className="rounded-lg bg-admin-soft p-3 text-xs">{isServerBacked ? t("confirm.serverNote") : t("confirm.localNote")}</p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="border-t border-admin-border px-5 py-4">
              <Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>{t("confirm.recheck")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={Boolean(cash.error)} onPress={() => onConfirm(cash.cashTendered)}>{t("confirm.submit")}</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
