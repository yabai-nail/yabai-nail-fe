"use client";

import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { CustomerAppointmentPanel } from "./CustomerAppointmentPanel";
import { initialCheckoutInvoice, type CheckoutInvoice } from "./data";
import { calculatePaymentTotals } from "./payment-state";

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
        <section className="min-w-0 rounded-lg border border-admin-border bg-admin-surface p-5" aria-label="Chi tiết thanh toán">
          <h2 className="text-base font-bold text-admin-ink">Cấu thành hóa đơn</h2>
          <p className="mt-2 text-sm text-admin-muted">Phần chọn dịch vụ và phương thức thanh toán đang được kết nối.</p>
          <p className="mt-6 text-2xl font-bold text-admin-accent">{totals.grandTotal.toLocaleString("vi-VN")} ₫</p>
        </section>
      </div>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-payments" } as const;

