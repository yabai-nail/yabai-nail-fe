"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { formatVnd } from "@/lib/admin-format";
import {
  adminService,
  useAdminAppointment,
  useAdminAppointmentPayments,
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
import type { CheckoutInvoice } from "./data";
import { calculatePaymentTotals, confirmPayment, setPaymentMethod } from "./payment-state";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { PaymentConfirmationDialog } from "./PaymentConfirmationDialog";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { PaymentSummaryPanel } from "./PaymentSummaryPanel";
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
 * doesn't yet provide (birthday, preference, spend) fall back to zeros /
 * empty strings — the page stays functional and the salon can still tick a
 * payment method and confirm. Staff commission is intentionally absent: the
 * backend owns the rate per staff member and recomputes it on capture.
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
  const customerName = customer?.displayName ?? customer?.name ?? "Khách chưa có tên";
  const staffName = staff?.displayName ?? "Nhân viên chưa có tên";

  const asService = (serviceId: string) => {
    const server = lookups.services.get(serviceId);
    return {
      id: serviceId,
      name: server?.name ?? "Dịch vụ chưa có tên",
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
      name: primaryService?.name ?? "Dịch vụ chưa có tên",
      price: primaryService?.priceVnd ?? 0,
    },
    currentService: {
      id: primaryServiceId,
      name: primaryService?.name ?? "Dịch vụ chưa có tên",
      price: primaryService?.priceVnd ?? 0,
    },
    additionalItems: appointment.serviceIds.slice(1).map((serviceId) => ({
      ...asService(serviceId),
      note: "",
      source: "catalog" as const,
    })),
    discount: appointment.discountVnd,
    paymentMethod: null,
    orderNote: "",
    status: ["PAID", "COMPLETED"].some((status) => appointment.status.toUpperCase().includes(status)) ? "paid" : "draft",
    paidAt: null,
  };
}

export function AdminPaymentsComponent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const { branchId } = useAdminBranch();

  // Parallel joins — same shape as the appointments page.
  const {
    data: appointment,
    error: appointmentError,
    isLoading: appointmentLoading,
    mutate: mutateAppointment,
  } = useAdminAppointment(
    branchId,
    appointmentId,
  );
  const { data: customersData } = useAdminCustomers(branchId);
  const { data: staffData } = useAdminStaff();
  const { data: servicesData } = useAdminServices();
  const payments = useAdminAppointmentPayments(branchId, appointmentId);
  const lookups = useMemo(() => ({
    customers: new Map((customersData?.items ?? []).map((c) => [c.id, c] as const)),
    staff: new Map((staffData?.items ?? []).map((s) => [s.id, s] as const)),
    services: new Map((servicesData?.items ?? []).map((s) => [s.id, s] as const)),
  }), [customersData, staffData, servicesData]);

  // Session working copy: seeded from server on first render, then owned by
  // the checkout panels for the rest of the session. useMemo (not useState
  // + effect) keeps setState out of an effect — the panels' `onChange`
  // handlers hydrate the working state below.
  const seededInvoice = useMemo<CheckoutInvoice | null>(() => {
    if (appointment) return buildInvoiceFromServer(appointment, lookups);
    return null;
  }, [appointment, lookups]);
  const [override, setOverride] = useState<CheckoutInvoice | null>(null);
  const invoice = override ?? seededInvoice;
  const setInvoice = (next: CheckoutInvoice | ((current: CheckoutInvoice) => CheckoutInvoice)) => {
    setOverride((current) => {
      const base = current ?? seededInvoice;
      if (!base) return current;
      return typeof next === "function" ? next(base) : next;
    });
  };

  const [isAppointmentCancelled, setIsAppointmentCancelled] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const totals = useMemo(() => (invoice ? calculatePaymentTotals(invoice) : null), [invoice]);

  const isServerBacked = Boolean(appointmentId && branchId && appointment);

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const handleConfirm = () => {
    if (!invoice || !totals) return;
    // Local status change so the UI flips to paid immediately.
    const result = confirmPayment(invoice, new Date().toISOString());
    setIsConfirmOpen(false);
    if (!result.ok) {
      // The validation message used to be dropped on the floor: the dialog
      // closed, no request went out, nothing on screen changed, and the staff
      // member had every reason to believe the money was taken.
      setConfirmError(result.error);
      return;
    }
    if (!isServerBacked) {
      setConfirmError(
        "Hóa đơn này chưa gắn với lịch hẹn thật nên không ghi được giao dịch.",
      );
      return;
    }
    setConfirmPending(true);
    setConfirmError(null);
    // Quote first, then record. The quote is what the backend will actually
    // charge; it ignores its request body entirely and echoes the totals already
    // stored on the appointment, so nothing is sent with it.
    void (async () => {
      try {
        const quote = await adminService.requestAppointmentPaymentQuote(
          branchId!,
          appointmentId!,
          undefined,
          appointment?.version,
        );
        // The screen's own total is only ever a preview. If it disagrees with the
        // amount the backend is about to charge, stop and say so rather than
        // confirming a number the salon read off the screen and the till will
        // never see. The field is amountDueVnd — an earlier version of this
        // check read quote.totalVnd, which the endpoint does not return, so the
        // comparison silently never ran.
        if (typeof quote.amountDueVnd === "number" && quote.amountDueVnd !== totals.grandTotal) {
          setConfirmError(
            `Số tiền trên màn hình (${formatVnd(totals.grandTotal)}) khác số máy chủ sẽ thu (${formatVnd(quote.amountDueVnd)}). Hãy tải lại và kiểm tra trước khi thu tiền.`,
          );
          return;
        }
        await adminService.recordAppointmentPayment(
          branchId!,
          appointmentId!,
          // Only `method` reaches the backend: it recomputes the amount from the
          // appointment so a client can never set a price. Sending amountVnd and
          // discountVnd looked like it did something and did not.
          { method: invoice.paymentMethod! },
          // Re-read the version: the quote above is itself a write, so the
          // appointment may have moved on since this handler started. The
          // quote's own field is loosely typed, so only trust a number.
          typeof quote.version === "number" ? quote.version : appointment?.version,
        );
        setInvoice(result.value);
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

  if (!appointmentId) {
    return (
      <AdminPageLayout>
        <p className="rounded-lg border border-admin-border bg-admin-surface px-4 py-8 text-center text-sm text-admin-muted">
          Mở một lịch hẹn rồi chọn thanh toán để tải hóa đơn thật.
        </p>
      </AdminPageLayout>
    );
  }
  if (appointmentError) {
    return (
      <AdminPageLayout>
        <p role="alert" className="rounded-lg border border-admin-danger/40 bg-admin-surface px-4 py-8 text-center text-sm text-admin-danger">
          Không tải được lịch hẹn. Không có giao dịch nào được tạo.
        </p>
      </AdminPageLayout>
    );
  }
  if (appointmentLoading || !invoice || !totals) {
    return (
      <AdminPageLayout>
        <p className="rounded-lg border border-admin-border bg-admin-surface px-4 py-8 text-center text-sm text-admin-muted">
          Đang tải hóa đơn từ máy chủ…
        </p>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <p className="mb-4 rounded-lg border border-admin-border bg-admin-soft px-4 py-3 text-xs leading-5 text-admin-muted">
        Kết nối với lịch hẹn thật — hệ thống gọi payment-quote trước khi ghi nhận thanh toán.
      </p>
      {payments.data?.items.length ? (
        <div className="mb-4 rounded-lg border border-admin-border bg-admin-surface px-4 py-3">
          <p className="text-xs font-semibold text-admin-ink">Giao dịch đã ghi nhận</p>
          <ul className="mt-2 space-y-1 text-xs text-admin-muted">
            {payments.data.items.map((payment) => (
              <li key={payment.id}>
                {payment.method} · {formatVnd(payment.amountVnd)} · {payment.status}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
      {isConfirmOpen ? <PaymentConfirmationDialog invoice={invoice} totals={totals} isServerBacked={isServerBacked} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirm} /> : null}
      {isPreviewOpen ? <InvoicePreviewModal invoice={invoice} totals={totals} onClose={() => setIsPreviewOpen(false)} /> : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-payments" } as const;
