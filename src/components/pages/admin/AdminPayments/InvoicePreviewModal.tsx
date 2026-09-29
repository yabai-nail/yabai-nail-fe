import { PrinterIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useFormatter, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import { paymentMethodLabel, type CheckoutInvoice } from "./data";
import type { PaymentTotals } from "./payment-state";
import { useAdminBranchDetail } from "@/service";

export type PaymentSettlementSummary = Readonly<{
  status: "unpaid" | "paid" | "partially_refunded" | "refunded";
  paymentId: string | null;
  paidAt: string | null;
  method: string | null;
  capturedAmount: number;
  refundedAmount: number;
  netAmount: number;
  cashTendered: number | null;
  cashChange: number | null;
}>;

export function InvoicePreviewModal({ invoice, branchId, totals, settlement, onClose }: Readonly<{ invoice: CheckoutInvoice; branchId: string; totals: PaymentTotals; settlement?: PaymentSettlementSummary | null; onClose: () => void }>) {
  const t = useTranslations("admin.payments");
  const format = useFormatter();
  const tMethod = useTranslations("admin.paymentMethod");
  const tBranch = useTranslations("admin.branches");
  const branch = useAdminBranchDetail(branchId);
  const when = t("invoice.at", { date: invoice.appointment.date, time: invoice.appointment.time });
  // Never print a partial receipt or a cached branch from a different appointment.
  if (branch.error || !branch.data || branch.data.id !== branchId || !branch.data.name.trim() || !branch.data.address?.trim()) {
    return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}><Modal.Backdrop><Modal.Container size="md"><Modal.Dialog><Modal.Header><Modal.Heading>{t("invoice.title")}</Modal.Heading></Modal.Header><Modal.Body><p role={branch.isLoading ? "status" : "alert"}>{tBranch(branch.isLoading ? "loading" : "loadFailed")}</p></Modal.Body><Modal.Footer><Button onPress={onClose}>{t("invoice.close")}</Button><Button isDisabled onPress={onClose}>{t("invoice.print")}</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>;
  }

  const paid = settlement && settlement.status !== "unpaid";
  const paidAt = settlement?.paidAt ? format.dateTime(new Date(settlement.paidAt), { dateStyle: "short", timeStyle: "short", timeZone: branch.data.timezone ?? "Asia/Tokyo" }) : null;
  const statusLabel = settlement?.status === "paid" ? t("invoice.statusPaid") : settlement?.status === "partially_refunded" ? t("invoice.statusPartiallyRefunded") : settlement?.status === "refunded" ? t("invoice.statusRefunded") : t("invoice.statusUnpaid");
  return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}><Modal.Backdrop className="invoice-print"><Modal.Container size="md" placement="center" scroll="inside"><Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface"><Modal.CloseTrigger className="rounded-lg print:hidden" /><Modal.Header className="border-b border-admin-border px-6 py-5"><div><p className="text-xs font-bold tracking-[0.18em] text-admin-accent">YABAI NAIL SALON</p><p className="mt-2 text-sm font-semibold text-admin-ink">{branch.data.name}</p><p className="text-xs text-admin-muted">{branch.data.address}</p><Modal.Heading className="mt-1 text-xl font-bold text-admin-ink">{t("invoice.title")}</Modal.Heading><p className="mt-1 text-xs text-admin-muted">{invoice.customer.name} · {when}</p><p className="mt-2 text-sm font-bold text-admin-ink">{statusLabel}</p></div></Modal.Header><Modal.Body className="space-y-5 px-6 py-5"><section><h3 className="text-sm font-bold text-admin-ink">{t("invoice.customer")}</h3><p className="mt-2 text-sm">{invoice.customer.name} · {invoice.customer.phone}</p><p className="text-xs text-admin-muted">{when}</p></section><section><h3 className="text-sm font-bold text-admin-ink">{t("invoice.services")}</h3><ul className="mt-2 divide-y divide-admin-border text-sm"><InvoiceRow name={invoice.currentService.name} amount={invoice.currentService.price} />{invoice.additionalItems.map((item) => <InvoiceRow key={item.id} name={item.name} amount={item.price} />)}</ul></section><dl className="space-y-2 border-y border-admin-border py-4 text-sm"><SummaryRow label={t("invoice.subtotal")} value={formatMoney(totals.subtotal)} /><SummaryRow label={t("invoice.discount")} value={`-${formatMoney(totals.discount)}`} /><SummaryRow label={t("invoice.total")} value={formatMoney(totals.grandTotal)} strong />{paid ? <><SummaryRow label={t("invoice.refunded")} value={formatMoney(settlement.refundedAmount)} /><SummaryRow label={t("invoice.netAmount")} value={formatMoney(settlement.netAmount)} strong /></> : null}</dl><p className="text-sm text-admin-muted">{t.rich("invoice.method", { method: settlement?.method ? paymentMethodLabel(settlement.method, tMethod) : t("invoice.methodNotChosen"), strong: (chunks) => <strong className="text-admin-ink">{chunks}</strong> })}</p>{paid ? <dl className="space-y-2 text-sm"><SummaryRow label={t("invoice.transactionId")} value={settlement.paymentId ?? "—"} />{paidAt ? <SummaryRow label={t("invoice.paidAt")} value={paidAt} /> : null}{settlement.method === "CASH" ? <><SummaryRow label={t("confirm.tenderedLabel")} value={formatMoney(settlement.cashTendered ?? settlement.capturedAmount)} /><SummaryRow label={t("confirm.cashChangeLabel")} value={formatMoney(settlement.cashChange ?? 0)} /></> : null}</dl> : null}{invoice.orderNote ? <p className="whitespace-pre-wrap rounded-lg bg-admin-soft p-3 text-xs text-admin-muted">{invoice.orderNote}</p> : null}</Modal.Body><Modal.Footer className="border-t border-admin-border px-6 py-4 print:hidden"><Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>{t("invoice.close")}</Button><Button variant="primary" className="rounded-lg" isDisabled={!paid} onPress={() => window.print()}><PrinterIcon className="size-4" />{t("invoice.print")}</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>;
}

function InvoiceRow({ name, amount }: Readonly<{ name: string; amount: number }>) { return <li className="flex justify-between gap-4 py-2"><span>{name}</span><strong>{formatMoney(amount)}</strong></li>; }
function SummaryRow({ label, value, strong = false }: Readonly<{ label: string; value: string; strong?: boolean }>) { return <div className="flex justify-between gap-4"><dt className={strong ? "font-bold text-admin-ink" : "text-admin-muted"}>{label}</dt><dd className={strong ? "font-bold text-admin-accent" : "font-semibold text-admin-ink"}>{value}</dd></div>; }

