"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import {
  adminService,
  useAdminAppointment,
  useAdminBranch,
  useAdminCustomers,
  useAdminServices,
  useAdminStaff,
  type AdminAppointment as ServerAppointment,
  type AdminCustomer,
  type AdminServiceItem,
  type AdminStaffMember,
} from "@/service";
import { CustomerAppointmentPanel } from "./CustomerAppointmentPanel";
import { initialCheckoutInvoice, type CheckoutInvoice } from "./data";
import { calculatePaymentTotals, confirmPayment, setPaymentMethod } from "./payment-state";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { PaymentConfirmationDialog } from "./PaymentConfirmationDialog";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { PaymentSummaryPanel } from "./PaymentSummaryPanel";
import { RefundPanel } from "./RefundPanel";
import { ServiceCheckoutPanel } from "./ServiceCheckoutPanel";

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/**
 * Adapt a real appointment + its joined lookups into the fixture-shaped
 * CheckoutInvoice the checkout components already consume. Values the API
 * doesn't yet provide (birthday, preference, spend, staff commission %)
 * fall back to zeros / empty strings — the page stays functional and the
 * salon can still tick a payment method and confirm.
 */
function buildInvoiceFromServer(
  appointment: ServerAppointment,
  lookups: {
    readonly customers: Map<string, AdminCustomer>;
    readonly services: Map<string, AdminServiceItem>;
    readonly staff: Map<string, AdminStaffMember>;
  },
): CheckoutInvoice {
  const customer = lookups.customers.get(appointment.customerId);
  const staff = lookups.staff.get(appointment.staffId);
  const primaryServiceId = appointment.serviceIds[0] ?? "unknown";
  const primaryService = lookups.services.get(primaryServiceId);
  const start = new Date(appointment.startsAt);
  const date = start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" });
  const time = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  const customerName = customer?.displayName ?? customer?.name ?? `Khách #${appointment.customerId.slice(0, 6)}`;
  const staffName = staff?.displayName ?? `Nhân viên #${appointment.staffId.slice(0, 6)}`;

  const asService = (serviceId: string) => {
    const server = lookups.services.get(serviceId);
    return {
      id: serviceId,
      name: server?.name ?? `Dịch vụ #${serviceId.slice(0, 6)}`,
      price: server?.priceVnd ?? 0,
    };
  };

  return {
    id: appointment.id,
    customer: {
      id: appointment.customerId,
      name: customerName,
      initials: deriveInitials(customerName),
      phone: customer?.phone ?? "",
      birthday: "",
      visits: 0,
      totalSpend: 0,
      preference: "",
    },
    appointment: {
      date,
      time,
      staffName,
      note: appointment.note ?? "",
    },
    bookedService: {
      id: primaryServiceId,
      name: primaryService?.name ?? `Dịch vụ #${primaryServiceId.slice(0, 6)}`,
      price: primaryService?.priceVnd ?? 0,
    },
    currentService: {
      id: primaryServiceId,
      name: primaryService?.name ?? `Dịch vụ #${primaryServiceId.slice(0, 6)}`,
      price: primaryService?.priceVnd ?? 0,
    },
    additionalItems: appointment.serviceIds.slice(1).map((serviceId) => ({
      ...asService(serviceId),
      note: "",
      source: "catalog" as const,
    })),
    discount: appointment.discountVnd,
    staffPercent: 60,
    paymentMethod: null,
    orderNote: "",
    status: appointment.status.toUpperCase().includes("PAID") ? "paid" : "draft",
    paidAt: null,
  };
}

export function AdminPaymentsComponent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const { branchId } = useAdminBranch();

  // Parallel joins — same shape as the appointments page.
  const { data: appointment, error: appointmentError, mutate: mutateAppointment } = useAdminAppointment(
    branchId,
    appointmentId,
  );
  const { data: customersData } = useAdminCustomers(branchId);
  const { data: staffData } = useAdminStaff();
  const { data: servicesData } = useAdminServices();
  const lookups = useMemo(() => ({
    customers: new Map((customersData?.items ?? []).map((c) => [c.id, c] as const)),
    staff: new Map((staffData?.items ?? []).map((s) => [s.id, s] as const)),
    services: new Map((servicesData?.items ?? []).map((s) => [s.id, s] as const)),
  }), [customersData, staffData, servicesData]);

  // Session working copy: seeded from server on first render, then owned by
  // the checkout panels for the rest of the session. useMemo (not useState
  // + effect) keeps setState out of an effect — the panels' `onChange`
  // handlers hydrate the working state below.
  const seededInvoice = useMemo<CheckoutInvoice>(() => {
    if (appointment) return buildInvoiceFromServer(appointment, lookups);
    return initialCheckoutInvoice;
  }, [appointment, lookups]);
  const [override, setOverride] = useState<CheckoutInvoice | null>(null);
  const invoice = override ?? seededInvoice;
  const setInvoice = (next: CheckoutInvoice | ((current: CheckoutInvoice) => CheckoutInvoice)) => {
    setOverride((current) => (typeof next === "function" ? next(current ?? seededInvoice) : next));
  };

  const [isAppointmentCancelled, setIsAppointmentCancelled] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const totals = useMemo(() => calculatePaymentTotals(invoice), [invoice]);

  const isServerBacked = Boolean(appointmentId && branchId && appointment);

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const handleConfirm = () => {
    // Local status change so the UI flips to paid immediately.
    const result = confirmPayment(invoice, new Date().toISOString());
    if (result.ok) setInvoice(result.value);
    setIsConfirmOpen(false);

    if (!isServerBacked || !invoice.paymentMethod) return;
    setConfirmPending(true);
    setConfirmError(null);
    // Two-step: quote first so BE reconciles line items + discount + surcharges;
    // record uses the BE-authoritative totalVnd, not the local calculation.
    void (async () => {
      try {
        // Quote inputs mirror what BE needs to reconcile totals against its
        // own catalog snapshot: primary service, ad-hoc additional items
        // (name + price + source), and the manual discount.
        const quote = await adminService.requestAppointmentPaymentQuote(
          branchId!,
          appointmentId!,
          {
            serviceIds: [
              invoice.currentService.id,
              ...invoice.additionalItems
                .filter((item) => item.source === "catalog")
                .map((item) => item.id),
            ],
            customItems: invoice.additionalItems
              .filter((item) => item.source === "custom")
              .map((item) => ({ name: item.name, priceVnd: item.price, note: item.note })),
            discountVnd: invoice.discount,
          },
        );
        await adminService.recordAppointmentPayment(branchId!, appointmentId!, {
          method: invoice.paymentMethod!,
          amountVnd: quote.totalVnd,
          discountVnd: quote.discountVnd,
        });
        void mutateAppointment();
      } catch (thrown) {
        setConfirmError(
          thrown instanceof Error ? thrown.message : "Không ghi được giao dịch.",
        );
      } finally {
        setConfirmPending(false);
      }
    })();
  };

  return (
    <AdminPageLayout>
      <p className="mb-4 rounded-lg border border-admin-border bg-admin-soft px-4 py-3 text-xs leading-5 text-admin-muted">
        {isServerBacked
          ? "Kết nối với lịch hẹn thật — hệ thống gọi payment-quote trước khi ghi nhận thanh toán."
          : appointmentError
            ? "Không tải được lịch hẹn — hiển thị mô phỏng nội bộ, không tạo giao dịch thật."
            : "Bản mô phỏng nội bộ: mở từ Chi tiết lịch hẹn để thanh toán một lịch thật."}
      </p>
      {confirmPending ? (
        <p className="mb-4 rounded-lg border border-admin-border bg-admin-surface px-4 py-2 text-xs text-admin-muted">
          Đang gọi quote và ghi giao dịch…
        </p>
      ) : null}
      {confirmError ? (
        <p role="alert" className="mb-4 rounded-lg border border-admin-danger/40 bg-admin-surface px-4 py-2 text-xs text-admin-danger">
          {confirmError}
        </p>
      ) : null}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(28rem,1fr)_18rem]">
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
      {isServerBacked ? <RefundPanel branchId={branchId!} appointmentId={appointmentId!} /> : null}
      {isConfirmOpen ? <PaymentConfirmationDialog invoice={invoice} totals={totals} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirm} /> : null}
      {isPreviewOpen ? <InvoicePreviewModal invoice={invoice} totals={totals} onClose={() => setIsPreviewOpen(false)} /> : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-payments" } as const;
