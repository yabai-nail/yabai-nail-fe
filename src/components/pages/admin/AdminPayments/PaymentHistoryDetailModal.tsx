"use client";

import { Button, Modal } from "@heroui/react";
import { useFormatter, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import { SALON_TIME_ZONE } from "@/lib/salon-date";
import { useAdminPayment } from "@/service";

function MoneyRow({ label, value, strong = false }: { readonly label: string; readonly value: number; readonly strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 ${strong ? "border-t border-admin-border pt-3 text-base font-bold" : "text-sm"}`}><dt className="text-admin-muted">{label}</dt><dd className="text-admin-ink">{formatMoney(value)}</dd></div>;
}

export function PaymentHistoryDetailModal({ branchId, paymentId, timeZone = SALON_TIME_ZONE, onClose }: {
  readonly branchId: string;
  readonly paymentId: string;
  readonly timeZone?: string;
  readonly onClose: () => void;
}) {
  const t = useTranslations("admin.payments.history");
  const format = useFormatter();
  const detail = useAdminPayment(branchId, paymentId);
  const payment = detail.data;
  const timestamp = payment ? format.dateTime(new Date(payment.paidAt), { timeZone, dateStyle: "medium", timeStyle: "short" }) : "";
  return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
    <Modal.Backdrop><Modal.Container size="lg" placement="center" scroll="inside"><Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
      <Modal.Header className="border-b border-admin-border px-5 py-4"><div><Modal.Heading className="text-base font-bold text-admin-ink">{t("detailTitle")}</Modal.Heading>{payment ? <p className="mt-1 text-xs text-admin-muted">{timestamp} · {payment.method}</p> : null}</div></Modal.Header>
      <Modal.Body className="space-y-5 px-5 py-4">
        {detail.isLoading ? <p aria-busy="true" className="py-8 text-center text-sm text-admin-muted">{t("loading")}</p> : detail.error ? <div role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger"><p>{t("loadFailed")}</p><Button size="sm" variant="secondary" className="mt-2" onPress={() => void detail.mutate()}>{t("retry")}</Button></div> : payment ? <>
          <section className="rounded-xl bg-admin-soft p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-admin-muted">{t("columns.customer")}</p><strong className="mt-1 block text-admin-ink">{payment.customer.displayName || "—"}</strong><p className="text-sm text-admin-muted">{payment.customer.phone || "—"}</p></div><div className="text-right"><p className="text-xs text-admin-muted">{t("staff")}</p><strong className="mt-1 block text-admin-ink">{payment.staff.displayName || "—"}</strong></div></div></section>
          <section><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">{t("columns.services")}</h3><ul className="divide-y divide-admin-border rounded-xl border border-admin-border">{payment.services.map((service) => <li key={service.id} className="flex justify-between gap-4 px-4 py-3 text-sm"><span className="text-admin-ink">{service.name}</span><strong className="whitespace-nowrap text-admin-ink">{formatMoney(service.unitPrice)}</strong></li>)}</ul></section>
          <section><dl className="space-y-2 rounded-xl border border-admin-border p-4"><MoneyRow label={t("serviceSubtotal")} value={payment.appointment.subtotal} />{payment.appointment.benefitDiscount ? <MoneyRow label={t("benefitDiscount")} value={-payment.appointment.benefitDiscount} /> : null}{payment.appointment.manualDiscount ? <MoneyRow label={t("manualDiscount")} value={-payment.appointment.manualDiscount} /> : null}<MoneyRow label={t("totalPaid")} value={payment.amount} strong />{payment.refundedAmount ? <MoneyRow label={t("summaryRefunded")} value={-payment.refundedAmount} /> : null}<MoneyRow label={t("summaryNet")} value={payment.netAmount} strong /></dl></section>
          {payment.cashTendered !== null && payment.cashTendered !== undefined ? <section className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-admin-soft p-3"><p className="text-xs text-admin-muted">{t("cashTendered")}</p><strong className="mt-1 block text-lg text-admin-ink">{formatMoney(payment.cashTendered)}</strong></div><div className="rounded-xl bg-admin-soft p-3"><p className="text-xs text-admin-muted">{t("cashChange")}</p><strong className="mt-1 block text-lg text-admin-ink">{formatMoney(payment.cashChange ?? 0)}</strong></div></section> : null}
          <section className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-admin-border p-3"><p className="text-xs text-admin-muted">{t("pointsRedeemed")}</p><strong className="mt-1 block text-admin-ink">{payment.points.redeemed}</strong></div><div className="rounded-xl border border-admin-border p-3"><p className="text-xs text-admin-muted">{t("pointsEarned")}</p><strong className="mt-1 block text-admin-ink">+{payment.points.earned}</strong></div></section>
          {payment.refunds.length ? <section><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">{t("refunds")}</h3><ul className="divide-y divide-admin-border rounded-xl border border-admin-border">{payment.refunds.map((refund) => <li key={refund.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="text-admin-muted">{format.dateTime(new Date(refund.createdAt), { timeZone, dateStyle: "medium", timeStyle: "short" })}</span><strong className="text-admin-danger">−{formatMoney(refund.amount)}</strong></li>)}</ul></section> : null}
          <section className="space-y-1 text-xs text-admin-muted"><p><strong>{t("transactionId")}:</strong> {payment.id}</p><p><strong>{t("appointmentId")}:</strong> {payment.appointmentId}</p>{payment.appointment.checkoutNote ? <p><strong>{t("notes")}:</strong> {payment.appointment.checkoutNote}</p> : null}</section>
        </> : null}
      </Modal.Body>
      <Modal.Footer className="flex justify-end border-t border-admin-border px-5 py-3"><Button variant="secondary" onPress={onClose}>{t("close")}</Button></Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>
  </Modal>;
}
