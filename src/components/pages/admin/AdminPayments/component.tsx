"use client";

import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { CustomerAppointmentPanel } from "./CustomerAppointmentPanel";
import { initialCheckoutInvoice, type CheckoutInvoice } from "./data";
import { calculatePaymentTotals } from "./payment-state";
import { confirmPayment, setPaymentMethod } from "./payment-state";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { PaymentConfirmationDialog } from "./PaymentConfirmationDialog";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { PaymentSummaryPanel } from "./PaymentSummaryPanel";
import { ServiceCheckoutPanel } from "./ServiceCheckoutPanel";

export function AdminPaymentsComponent() {
  const [invoice, setInvoice] = useState<CheckoutInvoice>(initialCheckoutInvoice);
  const [isAppointmentCancelled, setIsAppointmentCancelled] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const totals = useMemo(() => calculatePaymentTotals(invoice), [invoice]);

  return (
    <AdminPageLayout>
      <p className="mb-4 rounded-lg border border-admin-border bg-admin-soft px-4 py-3 text-xs leading-5 text-admin-muted">
        Bản mô phỏng nội bộ: thao tác chỉ lưu trong phiên hiện tại và không tạo giao dịch thật.
      </p>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] 2xl:grid-cols-[17rem_minmax(31rem,1fr)_19rem]">
        <CustomerAppointmentPanel
          invoice={invoice}
          isCancelled={isAppointmentCancelled}
          onAppointmentChange={(patch) => setInvoice((current) => ({
            ...current,
            appointment: { ...current.appointment, ...patch },
          }))}
          onCancel={() => setIsAppointmentCancelled(true)}
        />
        <ServiceCheckoutPanel invoice={invoice} onChange={setInvoice}>
          <div className="border-t border-admin-border px-4 py-4"><div className="mb-3 flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md border border-admin-accent text-xs font-bold text-admin-accent">3</span><h2 className="font-bold text-admin-ink">Xác nhận & thanh toán</h2></div><PaymentMethodPicker value={invoice.paymentMethod} isDisabled={invoice.status === "paid"} onChange={(method) => { const result = setPaymentMethod(invoice, method); if (result.ok) setInvoice(result.value); }} /><div className="mt-4 flex items-center justify-between border-t border-admin-border pt-4"><span className="text-sm font-semibold text-admin-ink">Tổng tiền khách thanh toán</span><strong className="text-xl text-admin-accent">{totals.grandTotal.toLocaleString("vi-VN")} ₫</strong></div></div>
        </ServiceCheckoutPanel>
        <PaymentSummaryPanel invoice={invoice} totals={totals} onChange={setInvoice} onConfirm={() => setIsConfirmOpen(true)} onPreview={() => setIsPreviewOpen(true)} />
      </div>
      {isConfirmOpen ? <PaymentConfirmationDialog invoice={invoice} totals={totals} onClose={() => setIsConfirmOpen(false)} onConfirm={() => { const result = confirmPayment(invoice, "2026-08-16T14:30:00.000Z"); if (result.ok) setInvoice(result.value); setIsConfirmOpen(false); }} /> : null}
      {isPreviewOpen ? <InvoicePreviewModal invoice={invoice} totals={totals} onClose={() => setIsPreviewOpen(false)} /> : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-payments" } as const;
