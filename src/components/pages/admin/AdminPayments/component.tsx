"use client";

import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { CustomerAppointmentPanel } from "./CustomerAppointmentPanel";
import { initialCheckoutInvoice, type CheckoutInvoice } from "./data";
import { calculatePaymentTotals } from "./payment-state";
import { ServiceCheckoutPanel } from "./ServiceCheckoutPanel";

export function AdminPaymentsComponent() {
  const [invoice, setInvoice] = useState<CheckoutInvoice>(initialCheckoutInvoice);
  const [isAppointmentCancelled, setIsAppointmentCancelled] = useState(false);
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
          <div className="border-t border-admin-border px-4 py-4 text-right"><span className="text-sm text-admin-muted">Tạm tính </span><strong className="ml-3 text-lg text-admin-accent">{totals.subtotal.toLocaleString("vi-VN")} ₫</strong></div>
        </ServiceCheckoutPanel>
      </div>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-payments" } as const;
