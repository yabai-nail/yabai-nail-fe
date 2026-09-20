import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import { paymentMethodLabel, type CheckoutInvoice } from "./data";
import { calculateCashTenderState, type PaymentTotals } from "./payment-state";

export function PaymentConfirmationDialog({ invoice, totals, cashTendered, isServerBacked, onClose, onConfirm }: Readonly<{
  invoice: CheckoutInvoice;
  totals: PaymentTotals;
  cashTendered: string;
  isServerBacked: boolean;
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
                <div className="rounded-lg border border-admin-border bg-admin-soft p-3 text-sm font-semibold text-admin-ink">
                  {t("cashResult", { tendered: formatMoney(cash.cashTendered ?? 0), change: formatMoney(cash.cashChange ?? 0) })}
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
