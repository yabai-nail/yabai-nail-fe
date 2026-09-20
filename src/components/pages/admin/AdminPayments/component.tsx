"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { formatMoney } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminAppointment,
  useAdminAppointmentPayments,
  useAdminBranch,
  useAdminCustomers,
  useAdminServices,
  useAdminStaff,
  useAdminPermission,
  type AdminAppointment as ServerAppointment,
  type AdminCustomer,
  type AdminServiceItem,
  type AdminStaffMember,
} from "@/service";
import { CashTenderPanel } from "./CashTenderPanel";
import { CustomerAppointmentPanel } from "./CustomerAppointmentPanel";
import type { Translator } from "@/i18n/config";
import { paymentMethodLabel, paymentStatusLabel, type CheckoutInvoice, type PaymentMethod } from "./data";
import { calculateCashTenderState, calculatePaymentTotals, confirmPayment, setPaymentMethod } from "./payment-state";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { PaymentConfirmationDialog } from "./PaymentConfirmationDialog";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { PaymentReviewDialog } from "./PaymentReviewDialog";
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
  t: Translator,
  formatDate: (value: Date) => string,
  formatTime: (value: Date) => string,
): CheckoutInvoice {
  const customer = lookups.customers.get(appointment.customerId);
  const staff = lookups.staff.get(appointment.staffId);
  const orderedSnapshots = [...(appointment.services ?? [])].sort((left, right) => left.sortOrder - right.sortOrder);
  const primaryServiceId = orderedSnapshots[0]?.serviceId ?? appointment.serviceIds[0] ?? "unknown";
  const primaryService = lookups.services.get(primaryServiceId);
  const start = new Date(appointment.startsAt);
  const date = formatDate(start);
  const time = formatTime(start);
  const customerName = customer?.displayName ?? customer?.name ?? t("fallback.customer");
  const staffName = staff?.displayName ?? t("fallback.staff");

  const asService = (serviceId: string) => {
    const snapshot = orderedSnapshots.find((item) => item.serviceId === serviceId);
    const server = lookups.services.get(serviceId);
    return {
      id: serviceId,
      name: snapshot?.serviceName ?? snapshot?.name ?? server?.name ?? t("fallback.service"),
      price: snapshot?.unitPrice ?? server?.price ?? 0,
    };
  };

  return {
    id: appointment.id,
    customer: {
      id: appointment.customerId,
      name: customerName,
      initials: deriveInitials(customerName),
      avatarUrl: customer?.avatarUrl ?? null,
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
      name: orderedSnapshots[0]?.serviceName ?? orderedSnapshots[0]?.name ?? primaryService?.name ?? t("fallback.service"),
      price: orderedSnapshots[0]?.unitPrice ?? primaryService?.price ?? 0,
    },
    currentService: {
      id: primaryServiceId,
      name: orderedSnapshots[0]?.serviceName ?? orderedSnapshots[0]?.name ?? primaryService?.name ?? t("fallback.service"),
      price: orderedSnapshots[0]?.unitPrice ?? primaryService?.price ?? 0,
    },
    additionalItems: appointment.serviceIds.slice(1).map((serviceId) => ({
      ...asService(serviceId),
      note: "",
      source: "catalog" as const,
    })),
    discount: (appointment.benefitDiscount ?? appointment.discount) + (appointment.manualDiscount ?? 0),
    benefitDiscount: appointment.benefitDiscount ?? appointment.discount,
    manualDiscount: appointment.manualDiscount ?? 0,
    discountReason: appointment.discountReason ?? appointment.manualDiscountReason ?? "",
    // Cash is the only supported counter method, so make the single available
    // choice explicit and show the tender/change fields immediately.
    paymentMethod: "cash",
    orderNote: appointment.checkoutNote ?? "",
    status: ["PAID", "COMPLETED"].some((status) => appointment.status.toUpperCase().includes(status)) ? "paid" : "draft",
    paidAt: null,
  };
}

export function AdminPaymentsComponent() {
  const t = useTranslations("admin.payments");
  const tMethod = useTranslations("admin.paymentMethod");
  const format = useFormatter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const { branchId } = useAdminBranch();
  const hasServiceEditPermission = useAdminPermission("catalog.write.branch", "catalog.write.all");
  const hasPaymentPermission = useAdminPermission("payment.create.branch");
  const canCreateReview = useAdminPermission("review.create.branch");

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
    if (appointment) {
      const invoice = buildInvoiceFromServer(
        appointment,
        lookups,
        t,
        (value) => format.dateTime(value, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }),
        (value) => format.dateTime(value, { hour: "2-digit", minute: "2-digit", hour12: false }),
      );
      const captured = payments.data?.items.find((payment) => payment.kind === "CAPTURE" && payment.status === "SUCCEEDED");
      if (captured) {
        const method = captured.method.toLowerCase();
        return {
          ...invoice,
          paymentMethod: (["cash", "card", "paypay", "bank_transfer", "other"].includes(method) ? method : "other") as PaymentMethod,
          status: "paid",
          paidAt: typeof captured.createdAt === "string" ? captured.createdAt : null,
        };
      }
      return invoice;
    }
    return null;
  }, [appointment, format, lookups, payments.data, t]);
  const [override, setOverride] = useState<CheckoutInvoice | null>(null);
  const invoice = override ?? seededInvoice;
  const setInvoice = (next: CheckoutInvoice | ((current: CheckoutInvoice) => CheckoutInvoice)) => {
    setOverride((current) => {
      const base = current ?? seededInvoice;
      if (!base) return current;
      return typeof next === "function" ? next(base) : next;
    });
  };

  const isAppointmentCancelled = Boolean(appointment?.status.toUpperCase().includes("CANCELLED"));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [cashTendered, setCashTendered] = useState("");
  const [cashResult, setCashResult] = useState<{ tendered: number; change: number } | null>(null);
  const paymentIdempotencyKey = useRef<string | null>(null);
  const reviewIdempotencyKey = useRef<string | null>(null);
  const totals = useMemo(() => (invoice ? calculatePaymentTotals(invoice) : null), [invoice]);

  const isServerBacked = Boolean(appointmentId && branchId && appointment);
  const serviceCatalog = useMemo(() => (servicesData?.items ?? []).filter((service) => service.active).map((service) => ({ id: service.id, name: service.name, price: service.price })), [servicesData]);
  const canEditServices = hasServiceEditPermission && Boolean(appointment && ["IN_SERVICE", "AWAITING_PAYMENT"].includes(appointment.status));
  const canAdjust = hasPaymentPermission && Boolean(appointment && ["IN_SERVICE", "AWAITING_PAYMENT"].includes(appointment.status));
  const canCreatePayment = hasPaymentPermission && appointment?.status === "AWAITING_PAYMENT";
  const cashState = invoice?.paymentMethod === "cash" && totals
    ? calculateCashTenderState(totals.grandTotal, cashTendered)
    : { cashTendered: null, cashChange: null, error: null };
  const canConfirmPayment = Boolean(canCreatePayment && invoice?.paymentMethod && !cashState.error);

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const persistServices = async (nextInvoice: CheckoutInvoice): Promise<string | null> => {
    if (!branchId || !appointmentId || !appointment) return t("error.noAppointment");
    try {
      const saved = await adminService.setAppointmentActualServices(
        branchId,
        appointmentId,
        { serviceIds: [nextInvoice.currentService.id, ...nextInvoice.additionalItems.map((item) => item.id)] },
        appointment.version,
      );
      setInvoice(nextInvoice);
      await mutateAppointment(saved, { revalidate: false });
      return null;
    } catch (thrown) {
      return thrown instanceof Error ? thrown.message : t("error.services");
    }
  };

  const persistAdjustments = async (manualDiscount: number, discountReason: string, checkoutNote: string): Promise<string | null> => {
    if (!branchId || !appointmentId || !appointment) return t("error.noAppointment");
    try {
      const saved = await adminService.updateAppointmentCheckoutAdjustments(
        branchId,
        appointmentId,
        { manualDiscount, discountReason, ...(checkoutNote ? { checkoutNote } : {}) },
        appointment.version,
        crypto.randomUUID(),
      );
      setInvoice((current) => ({
        ...current,
        benefitDiscount: saved.benefitDiscount,
        manualDiscount: saved.manualDiscount,
        discount: saved.totalDiscount,
        discountReason: saved.discountReason,
        orderNote: saved.checkoutNote ?? "",
      }));
      await mutateAppointment({
        ...appointment,
        total: saved.subtotal,
        discount: saved.benefitDiscount,
        benefitDiscount: saved.benefitDiscount,
        manualDiscount: saved.manualDiscount,
        manualDiscountReason: saved.discountReason,
        discountReason: saved.discountReason,
        checkoutNote: saved.checkoutNote,
        version: saved.version,
      }, { revalidate: false });
      return null;
    } catch (thrown) {
      return thrown instanceof Error ? thrown.message : t("error.adjustments");
    }
  };
  const handleConfirm = (receivedCash: number | null) => {
    if (!invoice || !totals) return;
    // Local status change so the UI flips to paid immediately.
    const result = confirmPayment(invoice, new Date().toISOString());
    setIsConfirmOpen(false);
    if (!result.ok) {
      // The validation message used to be dropped on the floor: the dialog
      // closed, no request went out, nothing on screen changed, and the staff
      // member had every reason to believe the money was taken.
      setConfirmError(t(result.error));
      return;
    }
    if (!isServerBacked) {
      setConfirmError(t("error.noAppointment"));
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
        // never see. The field is amountDue — an earlier version of this
        // check read quote.total, which the endpoint does not return, so the
        // comparison silently never ran.
        if (typeof quote.amountDue === "number" && quote.amountDue !== totals.grandTotal) {
          setConfirmError(
            t("error.amountMismatch", {
              screen: formatMoney(totals.grandTotal),
              server: formatMoney(quote.amountDue),
            }),
          );
          return;
        }
        paymentIdempotencyKey.current ??= crypto.randomUUID();
        const capture = await adminService.recordAppointmentPayment(
          branchId!,
          appointmentId!,
          {
            method: "CASH",
            ...(receivedCash === null ? {} : { cashTendered: receivedCash }),
          },
          // Re-read the version: the quote above is itself a write, so the
          // appointment may have moved on since this handler started. The
          // quote's own field is loosely typed, so only trust a number.
          typeof quote.version === "number" ? quote.version : appointment?.version,
          paymentIdempotencyKey.current,
        );
        paymentIdempotencyKey.current = null;
        if (capture.payment.cashTendered !== null && capture.payment.cashTendered !== undefined) {
          setCashResult({ tendered: capture.payment.cashTendered, change: capture.payment.cashChange ?? 0 });
        }
        notifySuccess(t("paymentRecorded"));
        setInvoice(result.value);
        await mutateAppointment(capture.appointment, { revalidate: false });
        if (canCreateReview) setIsReviewOpen(true);
      } catch (thrown) {
        setConfirmError(
          thrown instanceof Error ? thrown.message : t("error.record"),
        );
      } finally {
        setConfirmPending(false);
      }
    })();
  };

  const handleReviewSubmit = async (input: { rating: number; comment: string }) => {
    if (!branchId || !appointmentId) throw new Error(t("review.submitFailed"));
    reviewIdempotencyKey.current ??= crypto.randomUUID();
    await adminService.createAppointmentReview(branchId, appointmentId, input, reviewIdempotencyKey.current);
    reviewIdempotencyKey.current = null;
    notifySuccess(t("review.submitted"));
    setIsReviewOpen(false);
  };

  if (!appointmentId) {
    return (
      <AdminPageLayout>
        <p className="rounded-lg border border-admin-border bg-admin-surface px-4 py-8 text-center text-sm text-admin-muted">
          {t("empty")}
        </p>
      </AdminPageLayout>
    );
  }
  if (appointmentError) {
    return (
      <AdminPageLayout>
        <p role="alert" className="rounded-lg border border-admin-danger/40 bg-admin-surface px-4 py-8 text-center text-sm text-admin-danger">
          {t("loadFailed")}
        </p>
      </AdminPageLayout>
    );
  }
  if (appointmentLoading || !invoice || !totals) {
    return (
      <AdminPageLayout>
        <p className="rounded-lg border border-admin-border bg-admin-surface px-4 py-8 text-center text-sm text-admin-muted">
          {t("loading")}
        </p>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <p className="mb-4 rounded-lg border border-admin-border bg-admin-soft px-4 py-3 text-xs leading-5 text-admin-muted">
        {t("serverBackedNote")}
      </p>
      {payments.data?.items.length ? (
        <div className="mb-4 rounded-lg border border-admin-border bg-admin-surface px-4 py-3">
          <p className="text-xs font-semibold text-admin-ink">{t("recorded")}</p>
          <ul className="mt-2 space-y-1 text-xs text-admin-muted">
            {payments.data.items.map((payment) => (
              <li key={payment.id}>
                {paymentMethodLabel(payment.method, tMethod)} · {formatMoney(payment.amount)} · {paymentStatusLabel(payment.status, t)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {confirmPending ? (
        <p className="mb-4 rounded-lg border border-admin-border bg-admin-surface px-4 py-2 text-xs text-admin-muted">
          {t("submitting")}
        </p>
      ) : null}
      {confirmError ? (
        <p role="alert" className="mb-4 rounded-lg border border-admin-danger/40 bg-admin-surface px-4 py-2 text-xs text-admin-danger">
          {confirmError}
        </p>
      ) : null}
      {cashResult ? (
        <p role="status" className="mb-4 rounded-lg border border-admin-accent/40 bg-admin-soft px-4 py-3 text-sm font-semibold text-admin-accent">
          {t("cashResult", { tendered: formatMoney(cashResult.tendered), change: formatMoney(cashResult.change) })}
        </p>
      ) : null}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(28rem,1fr)_18rem]">
        <CustomerAppointmentPanel
          invoice={invoice}
          isCancelled={isAppointmentCancelled}
        />
        <ServiceCheckoutPanel invoice={invoice} services={serviceCatalog} canEdit={canEditServices} onSave={persistServices}>
          <div className="border-t border-admin-border px-4 py-4"><div className="mb-3 flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md border border-admin-accent text-xs font-bold text-admin-accent">3</span><h2 className="font-bold text-admin-ink">{t("step3")}</h2></div><PaymentMethodPicker value={invoice.paymentMethod} isDisabled={!canCreatePayment || invoice.status === "paid"} onChange={(method) => { const result = setPaymentMethod(invoice, method); if (result.ok) setInvoice(result.value); }} />{invoice.paymentMethod === "cash" && totals.grandTotal > 0 && invoice.status !== "paid" ? <CashTenderPanel amountDue={totals.grandTotal} value={cashTendered} disabled={!canCreatePayment} onChange={setCashTendered} /> : null}<div className="mt-4 flex items-center justify-between border-t border-admin-border pt-4"><span className="text-sm font-semibold text-admin-ink">{t("grandTotalLabel")}</span><strong className="text-xl text-admin-accent">{formatMoney(totals.grandTotal)}</strong></div></div>
        </ServiceCheckoutPanel>
        <PaymentSummaryPanel key={`${invoice.manualDiscount}:${invoice.discountReason}:${invoice.orderNote}`} invoice={invoice} totals={totals} canAdjust={canAdjust} canConfirmPayment={canConfirmPayment} canCreateReview={canCreateReview} onSaveAdjustments={persistAdjustments} onConfirm={() => { setCashResult(null); setIsConfirmOpen(true); }} onPreview={() => setIsPreviewOpen(true)} onReview={() => setIsReviewOpen(true)} />
      </div>
      {isConfirmOpen ? <PaymentConfirmationDialog invoice={invoice} totals={totals} cashTendered={cashTendered} isServerBacked={isServerBacked} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirm} /> : null}
      {isPreviewOpen ? <InvoicePreviewModal invoice={invoice} totals={totals} onClose={() => setIsPreviewOpen(false)} /> : null}
      {isReviewOpen ? <PaymentReviewDialog customer={invoice.customer} onClose={() => setIsReviewOpen(false)} onSubmit={handleReviewSubmit} /> : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-payments" } as const;
