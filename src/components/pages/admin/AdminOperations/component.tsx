"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Button, Card, Chip } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminAppointmentPayments,
  useAdminAppointments,
  useAdminBranch,
  useAdminCustomers,
  useAdminPaymentRefund,
  useAdminPermission,
} from "@/service";
import {
  formatMoney,
  parseMoney,
  refundableBalance,
  summarizeCheckIn,
  summarizeCustomer,
  summarizeMembership,
  membershipTierLabel,
  type CheckInResolutionView,
  type CustomerHit,
  type MembershipResolutionView,
  type ResolvedCustomer,
} from "./data";

const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
const labelClass = "block text-xs font-semibold text-admin-ink";

/** Vietnamese mobile numbers; anything else typed here is a scanned membership QR. */
const PHONE_PATTERN = /^0\d{9}$/;

/**
 * The resolution endpoints only understand a membership QR payload or a phone
 * number, so pick between the two rather than sending a `code` nobody reads.
 */
function resolutionInput(value: string): { phone: string } | { qrPayload: string } {
  return PHONE_PATTERN.test(value) ? { phone: value } : { qrPayload: value };
}

export function AdminOperationsComponent() {
  const t = useTranslations("admin.operations");
  const { branchId } = useAdminBranch();
  const canRefund = useAdminPermission("refund.create.branch");
  const canResolveQueue = useAdminPermission("appointment.queue.read.branch");

  if (!branchId) {
    return (
      <AdminPageLayout>
        <p className="text-sm text-admin-muted">{t("pickBranch")}</p>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      {/*
        The refund panel is the only one that lists anything — the other three take a
        phone number or a scanned QR and answer with one record — so it takes the full
        width and the rest share the grid below it.
      */}
      <div className="grid gap-4">
        {canRefund ? <RefundForm branchId={branchId} /> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {canResolveQueue ? <CheckInForm branchId={branchId} /> : null}
          {canResolveQueue ? <MembershipForm branchId={branchId} /> : null}
          <CustomerLookup branchId={branchId} />
        </div>
      </div>
    </AdminPageLayout>
  );
}

function useAction() {
  const t = useTranslations("admin.operations");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (task: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      setMessage(await task());
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("actionFailed"));
    } finally {
      setBusy(false);
    }
  };
  return { busy, message, error, run };
}

function Feedback({ message, error }: Readonly<{ message: string | null; error: string | null }>) {
  if (error) return <p className="text-sm text-admin-danger" role="alert">{error}</p>;
  if (message) return <p className="text-sm text-admin-accent">{message}</p>;
  return null;
}

/** Appointment statuses whose money has already been taken, so a refund has something to undo. */
const PAID_STATUSES = ["PAID", "COMPLETED"];

/** Rows per page. Eight keeps the table shorter than the form beneath it. */
const REFUND_PAGE_SIZE = 8;

function RefundForm({ branchId }: Readonly<{ branchId: string }>) {
  const t = useTranslations("admin.operations");
  const format = useFormatter();
  const tStatus = useTranslations("admin.appointmentStatus");
  const tMethod = useTranslations("admin.paymentMethod");
  const tPayment = useTranslations("admin.payments");
  const appointments = useAdminAppointments(branchId);
  const customers = useAdminCustomers(branchId);
  const [appointmentId, setAppointmentId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const payments = useAdminAppointmentPayments(branchId, appointmentId || null);
  const [amountText, setAmountText] = useState("");
  const [reason, setReason] = useState("");
  const [refundTarget, setRefundTarget] = useState<{ paymentId: string; refundId: string } | null>(null);
  const [page, setPage] = useState(1);
  const { busy, message, error, run } = useAction();
  const refund = useAdminPaymentRefund(branchId, refundTarget?.paymentId ?? null, refundTarget?.refundId ?? null);
  const amount = parseMoney(amountText);
  const customerNames = new Map((customers.data?.items ?? []).map((customer) => [
    customer.id,
    customer.displayName ?? customer.name ?? t("unnamedCustomer"),
  ] as const));
  // The picker used to offer every appointment in the branch under a heading that said
  // "paid", so most of what it listed had no payment to refund and failed on submit.
  const paidAppointments = useMemo(
    () =>
      (appointments.data?.items ?? []).filter((appointment) =>
        PAID_STATUSES.some((status) => appointment.status.toUpperCase().includes(status)),
      ),
    [appointments.data],
  );
  // The page number is clamped rather than reset: a branch whose list shrinks under the
  // reader — a refund landing, a poll returning fewer rows — should not leave them
  // staring at an empty page they cannot page back from.
  const pageCount = Math.max(1, Math.ceil(paidAppointments.length / REFUND_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleAppointments = paidAppointments.slice(
    (currentPage - 1) * REFUND_PAGE_SIZE,
    currentPage * REFUND_PAGE_SIZE,
  );
  const selected = paidAppointments.find((appointment) => appointment.id === appointmentId);
  const transactions = payments.data?.items ?? [];
  const selectedCapture = transactions.find((payment) => payment.id === paymentId && payment.kind !== "REFUND" && payment.status === "SUCCEEDED");
  const remaining = selectedCapture ? refundableBalance(selectedCapture, transactions) : 0;
  const disabled = busy || !selectedCapture || amount <= 0 || amount > remaining || reason.trim().length < 2;
  const statusLabel = (status: string) => {
    const code = status.toUpperCase();
    return tStatus.has(code) ? tStatus(code) : status;
  };
  const paymentStatusLabel = (status: string) => {
    const key = `status.${status.toUpperCase()}`;
    return tPayment.has(key) ? tPayment(key) : status;
  };
  const methodLabel = (method: string) => {
    const code = method.toLowerCase();
    return tMethod.has(code) ? tMethod(code) : method;
  };

  function pickAppointment(id: string) {
    setAppointmentId(id);
    setPaymentId("");
  }

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">{t("refund.heading")}</h2>

      <div className="grid gap-1">
        <span className={labelClass}>{t("refund.paidAppointment")}</span>
        {appointments.isLoading ? (
          <p className="text-xs text-admin-muted">{t("refund.loadingAppointments")}</p>
        ) : paidAppointments.length === 0 ? (
          <p className="text-xs text-admin-muted">{t("refund.noAppointments")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-admin-border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">{t("refund.caption")}</caption>
              <thead className="border-b border-admin-border text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="px-3 py-2">{t("refund.columns.customer")}</th>
                  <th scope="col" className="px-3 py-2">{t("refund.columns.time")}</th>
                  <th scope="col" className="px-3 py-2 text-right">{t("refund.columns.total")}</th>
                  <th scope="col" className="px-3 py-2">{t("refund.columns.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {visibleAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    aria-selected={appointment.id === appointmentId}
                    className={`cursor-pointer transition-colors hover:bg-admin-soft/60 ${
                      appointment.id === appointmentId ? "bg-admin-soft" : ""
                    }`}
                    onClick={() => pickAppointment(appointment.id)}
                  >
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        className="h-auto min-h-10 justify-start rounded-lg px-1 font-semibold"
                        onPress={() => pickAppointment(appointment.id)}
                      >
                        {customerNames.get(appointment.customerId) ?? t("unnamedCustomer")}
                      </Button>
                    </td>
                    <td className="px-3 py-2 text-admin-muted">
                      {format.dateTime(new Date(appointment.startsAt), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{formatMoney(appointment.total)}</td>
                    <td className="px-3 py-2">
                      <Chip size="sm" variant="soft" color="success">
                        <Chip.Label>{statusLabel(appointment.status)}</Chip.Label>
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-3 border-t border-admin-border px-3 py-2 text-xs text-admin-muted">
              <span>{t("refund.showing", { shown: visibleAppointments.length, total: paidAppointments.length })}</span>
              <AdminPagination
                page={currentPage}
                pageCount={pageCount}
                onPageChange={setPage}
                label={t("refund.pagination")}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-1">
        <span className={labelClass}>{t("refund.transaction")}</span>
        {!selected ? (
          <p className="text-xs text-admin-muted">{t("refund.selectAppointment")}</p>
        ) : payments.isLoading ? (
          <p className="text-xs text-admin-muted">{t("refund.loadingTransactions")}</p>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-admin-muted">{t("refund.noTransactions")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-admin-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <caption className="sr-only">
                {t("refund.transactionsFor", { name: customerNames.get(selected.customerId) ?? t("unnamedCustomer") })}
              </caption>
              <thead className="border-b border-admin-border text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 text-right">{t("refund.transactionColumns.amount")}</th>
                  <th scope="col" className="px-3 py-2">{t("refund.transactionColumns.method")}</th>
                  <th scope="col" className="px-3 py-2">{t("refund.transactionColumns.status")}</th>
                  <th scope="col" className="px-3 py-2">{t("refund.transactionColumns.paidAt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {transactions.map((payment) => (
                  <tr
                    key={payment.id}
                    aria-selected={payment.id === paymentId}
                    className={`cursor-pointer transition-colors hover:bg-admin-soft/60 ${
                      payment.id === paymentId ? "bg-admin-soft" : ""
                    }`}
                    onClick={() => { if (payment.kind !== "REFUND" && payment.status === "SUCCEEDED") setPaymentId(payment.id); }}
                  >
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        isDisabled={payment.kind === "REFUND" || payment.status !== "SUCCEEDED"}
                        className="h-auto min-h-10 justify-end rounded-lg px-1 font-semibold"
                        onPress={() => setPaymentId(payment.id)}
                      >
                        {payment.kind === "REFUND" ? `−${formatMoney(payment.amount)}` : formatMoney(payment.amount)}
                      </Button>
                    </td>
                    <td className="px-3 py-2">{methodLabel(payment.method)}</td>
                    <td className="px-3 py-2 text-admin-muted">{payment.kind === "REFUND" ? `${t("refund.heading")} · ` : ""}{paymentStatusLabel(payment.status)}</td>
                    <td className="px-3 py-2 text-admin-muted">
                      {payment.paidAt ? format.dateTime(new Date(payment.paidAt), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : payment.createdAt ? format.dateTime(new Date(payment.createdAt), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCapture ? <p className="text-xs text-admin-muted">{t("refund.remaining", { amount: formatMoney(remaining) })}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <label className={labelClass} htmlFor="ops-refund-amount">{t("refund.amount")}</label>
          <input id="ops-refund-amount" className={inputClass} value={amountText} onChange={(event) => setAmountText(event.target.value)} placeholder={t("refund.amount")} inputMode="numeric" />
        </div>
        <div className="grid gap-1">
          <label className={labelClass} htmlFor="ops-refund-reason">{t("refund.reason")}</label>
          <input id="ops-refund-reason" className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("refund.reason")} />
        </div>
      </div>

      <Feedback message={message} error={error} />
      {refund.data ? (
        <p className="text-xs text-admin-muted">
          {t("refund.result", { amount: formatMoney(refund.data.amount), status: refund.data.status })}
        </p>
      ) : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={disabled} onPress={() => void run(async () => {
          const normalizedPaymentId = paymentId.trim();
          const payment = await adminService.payment(branchId, normalizedPaymentId);
          const created = await adminService.refundPayment(
            branchId,
            normalizedPaymentId,
            { amount, reasonCode: reason.trim() },
            payment.version,
          );
          setRefundTarget({ paymentId: normalizedPaymentId, refundId: created.id });
          setPaymentId("");
          setAmountText("");
          setReason("");
          notifySuccess(t("refund.recorded"));
          await payments.mutate().catch(() => undefined);
          return null;
        })}>{busy ? t("refund.busy") : t("refund.heading")}</Button>
      </div>
    </Card>
  );
}

/** Name, tier and point balance — what the receptionist greets the customer with. */
function CustomerCard({ customer }: Readonly<{ customer: ResolvedCustomer }>) {
  const t = useTranslations("admin.operations");
  const format = useFormatter();

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span className="text-sm font-semibold text-admin-ink">{customer.name}</span>
      <span className="font-mono text-sm text-admin-muted">{customer.phone}</span>
      <span className="text-xs text-admin-muted">
        {t("tierLine", { tier: membershipTierLabel(customer.tier, t), points: format.number(customer.points) })}
      </span>
    </div>
  );
}

function CheckInForm({ branchId }: Readonly<{ branchId: string }>) {
  const t = useTranslations("admin.operations");
  const tStatus = useTranslations("admin.appointmentStatus");
  const statusLabel = (status: string) => {
    const code = status.toUpperCase();
    return tStatus.has(code) ? tStatus(code) : status;
  };
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckInResolutionView | null>(null);
  const { busy, message, error, run } = useAction();

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">{t("checkin.heading")}</h2>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-checkin-code">{t("checkin.codeLabel")}</label>
        <input id="ops-checkin-code" className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} placeholder={t("checkin.codeLabel")} />
      </div>
      <Feedback message={message} error={error} />
      {result ? (
        <div className="grid gap-2 rounded-lg border border-admin-border p-3">
          <CustomerCard customer={result.customer} />
          <p className="text-xs font-semibold text-admin-muted">{t("checkin.dayHeading", { date: result.localDate })}</p>
          {result.appointments.length > 0 ? (
            <ul className="divide-y divide-admin-border">
              {result.appointments.map((appointment) => (
                <li key={appointment.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span className="font-mono text-admin-ink">{appointment.time}</span>
                  <span className="text-admin-muted">{appointment.status}</span>
                  <span className="font-mono text-admin-muted">{formatMoney(appointment.total)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-admin-muted">{t("checkin.none")}</p>
          )}
        </div>
      ) : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy || !code.trim()} onPress={() => void run(async () => {
          setResult(null);
          const resolution = await adminService.resolveCheckIn(branchId, resolutionInput(code.trim()));
          const view = summarizeCheckIn(resolution, statusLabel);
          setResult(view);
          return t("checkin.done", { name: view.customer.name });
        })}>{busy ? t("lookupBusy") : t("lookupSubmit")}</Button>
      </div>
    </Card>
  );
}

function MembershipForm({ branchId }: Readonly<{ branchId: string }>) {
  const t = useTranslations("admin.operations");
  const tc = useTranslations("admin.common");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<MembershipResolutionView | null>(null);
  const { busy, message, error, run } = useAction();

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">{t("membership.heading")}</h2>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-membership-code">{t("membership.codeLabel")}</label>
        <input id="ops-membership-code" className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} placeholder={t("membership.codeLabel")} />
      </div>
      <Feedback message={message} error={error} />
      {result ? (
        <div className="grid gap-2 rounded-lg border border-admin-border p-3">
          <CustomerCard customer={result.customer} />
        </div>
      ) : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy || !code.trim()} onPress={() => void run(async () => {
          setResult(null);
          const resolution = await adminService.resolveMembershipCard(branchId, resolutionInput(code.trim()));
          const view = summarizeMembership(resolution);
          setResult(view);
          return tc("membershipFound", { name: view.customer.name });
        })}>{busy ? t("lookupBusy") : t("lookupSubmit")}</Button>
      </div>
    </Card>
  );
}

function CustomerLookup({ branchId }: Readonly<{ branchId: string }>) {
  const t = useTranslations("admin.operations");
  const tc = useTranslations("admin.common");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ReadonlyArray<CustomerHit>>([]);
  const { busy, message, error, run } = useAction();

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none lg:col-span-2">
      <h2 className="text-sm font-bold text-admin-ink">{t("customerLookup.heading")}</h2>
      <div className="flex items-end gap-2">
        <div className="grid flex-1 gap-1">
          <label className={labelClass} htmlFor="ops-lookup-query">{t("customerLookup.queryLabel")}</label>
          <input id="ops-lookup-query" className={`${inputClass} w-full`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("customerLookup.queryLabel")} />
        </div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy || query.trim().length < 2} onPress={() => void run(async () => {
          const result = await adminService.lookupCustomer(branchId, { q: query.trim() });
          setHits(result.items.map(summarizeCustomer));
          return tc("customersFound", { count: result.items.length });
        })}>{busy ? t("customerLookup.busy") : t("lookupSubmit")}</Button>
      </div>
      <Feedback message={message} error={error} />
      {hits.length > 0 ? (
        <ul className="divide-y divide-admin-border rounded-lg border border-admin-border">
          {hits.map((hit) => (
            <li key={hit.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="font-medium text-admin-ink">{hit.name}</span>
              <span className="font-mono text-admin-muted">{hit.phone}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

export const meta = { world: "connected", domain: "admin-operations" } as const;
