"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import {
  adminService,
  useAdminAppointmentPayments,
  useAdminAppointments,
  useAdminBranch,
  useAdminCustomers,
  useAdminPaymentRefund,
} from "@/service";
import {
  formatMoney,
  parseMoney,
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
  const { branchId } = useAdminBranch();

  if (!branchId) {
    return (
      <AdminPageLayout>
        <p className="text-sm text-admin-muted">Hãy chọn chi nhánh để thực hiện thao tác vận hành.</p>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <div className="grid gap-4 lg:grid-cols-2">
        <RefundForm branchId={branchId} />
        <CheckInForm branchId={branchId} />
        <MembershipForm branchId={branchId} />
        <CustomerLookup branchId={branchId} />
      </div>
    </AdminPageLayout>
  );
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (task: () => Promise<string>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      setMessage(await task());
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Thao tác thất bại.");
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

function RefundForm({ branchId }: Readonly<{ branchId: string }>) {
  const appointments = useAdminAppointments(branchId);
  const customers = useAdminCustomers(branchId);
  const [appointmentId, setAppointmentId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const payments = useAdminAppointmentPayments(branchId, appointmentId || null);
  const [amountText, setAmountText] = useState("");
  const [reason, setReason] = useState("");
  const [refundTarget, setRefundTarget] = useState<{ paymentId: string; refundId: string } | null>(null);
  const { busy, message, error, run } = useAction();
  const refund = useAdminPaymentRefund(branchId, refundTarget?.paymentId ?? null, refundTarget?.refundId ?? null);
  const amount = parseMoney(amountText);
  const disabled = busy || !paymentId.trim() || amount <= 0 || reason.trim().length < 2;
  const customerNames = new Map((customers.data?.items ?? []).map((customer) => [
    customer.id,
    customer.displayName ?? customer.name ?? "Khách chưa có tên",
  ] as const));
  const appointmentOptions = (appointments.data?.items ?? []).map((appointment) => ({
    value: appointment.id,
    label: `${customerNames.get(appointment.customerId) ?? "Khách chưa có tên"} · ${new Date(appointment.startsAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
  }));
  const paymentOptions = (payments.data?.items ?? []).map((payment) => ({
    value: payment.id,
    label: `${formatMoney(payment.amount)} · ${{ cash: "Tiền mặt", card: "Thẻ", paypay: "PayPay", bank_transfer: "Chuyển khoản" }[payment.method.toLowerCase()] ?? payment.method}`,
  }));

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Hoàn tiền</h2>
      <div className="grid gap-1">
        <span className={labelClass}>Lịch hẹn đã thanh toán</span>
        <AdminSelectField
          label="Chọn lịch hẹn"
          fullWidth
          value={appointmentId}
          onChange={(value) => { setAppointmentId(value); setPaymentId(""); }}
          options={appointmentOptions}
        />
      </div>
      <div className="grid gap-1">
        <span className={labelClass}>Giao dịch</span>
        {appointmentId && paymentOptions.length === 0 ? (
          <p className="text-xs text-admin-muted">{payments.isLoading ? "Đang tải giao dịch…" : "Lịch hẹn này chưa có giao dịch."}</p>
        ) : (
          <AdminSelectField
            label="Chọn giao dịch"
            fullWidth
            value={paymentId}
            onChange={setPaymentId}
            options={paymentOptions}
          />
        )}
      </div>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-refund-amount">Số tiền hoàn (¥)</label>
        <input id="ops-refund-amount" className={inputClass} value={amountText} onChange={(event) => setAmountText(event.target.value)} placeholder="Số tiền hoàn (¥)" inputMode="numeric" />
      </div>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-refund-reason">Lý do hoàn</label>
        <input id="ops-refund-reason" className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do hoàn" />
      </div>
      <Feedback message={message} error={error} />
      {refund.data ? (
        <p className="text-xs text-admin-muted">
          Yêu cầu hoàn {formatMoney(refund.data.amount)} · {refund.data.status}
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
          return "Đã ghi nhận hoàn tiền.";
        })}>{busy ? "Đang xử lý…" : "Hoàn tiền"}</Button>
      </div>
    </Card>
  );
}

/** Name, tier and point balance — what the receptionist greets the customer with. */
function CustomerCard({ customer }: Readonly<{ customer: ResolvedCustomer }>) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span className="text-sm font-semibold text-admin-ink">{customer.name}</span>
      <span className="font-mono text-sm text-admin-muted">{customer.phone}</span>
      <span className="text-xs text-admin-muted">
        Hạng {membershipTierLabel(customer.tier)} · {customer.points.toLocaleString("vi-VN")} điểm
      </span>
    </div>
  );
}

function CheckInForm({ branchId }: Readonly<{ branchId: string }>) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckInResolutionView | null>(null);
  const { busy, message, error, run } = useAction();

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Tra cứu khách check-in</h2>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-checkin-code">Mã QR thành viên hoặc SĐT</label>
        <input id="ops-checkin-code" className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Mã QR thành viên hoặc SĐT" />
      </div>
      <Feedback message={message} error={error} />
      {result ? (
        <div className="grid gap-2 rounded-lg border border-admin-border p-3">
          <CustomerCard customer={result.customer} />
          <p className="text-xs font-semibold text-admin-muted">Lịch hẹn ngày {result.localDate}</p>
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
            <p className="text-sm text-admin-muted">Không có lịch hẹn nào trong ngày.</p>
          )}
        </div>
      ) : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy || !code.trim()} onPress={() => void run(async () => {
          setResult(null);
          const resolution = await adminService.resolveCheckIn(branchId, resolutionInput(code.trim()));
          const view = summarizeCheckIn(resolution);
          setResult(view);
          return `Đã tra cứu ${view.customer.name}. Lịch hẹn chưa đổi trạng thái — mở màn Lịch hẹn để check-in.`;
        })}>{busy ? "Đang tra cứu…" : "Tra cứu"}</Button>
      </div>
    </Card>
  );
}

function MembershipForm({ branchId }: Readonly<{ branchId: string }>) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<MembershipResolutionView | null>(null);
  const { busy, message, error, run } = useAction();

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Tra cứu thẻ thành viên</h2>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-membership-code">Mã QR thẻ hoặc SĐT</label>
        <input id="ops-membership-code" className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Mã QR thẻ hoặc SĐT" />
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
          return `Đã tra cứu thẻ của ${view.customer.name}.`;
        })}>{busy ? "Đang tra cứu…" : "Tra cứu"}</Button>
      </div>
    </Card>
  );
}

function CustomerLookup({ branchId }: Readonly<{ branchId: string }>) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ReadonlyArray<CustomerHit>>([]);
  const { busy, message, error, run } = useAction();

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none lg:col-span-2">
      <h2 className="text-sm font-bold text-admin-ink">Tra cứu khách hàng</h2>
      <div className="flex items-end gap-2">
        <div className="grid flex-1 gap-1">
          <label className={labelClass} htmlFor="ops-lookup-query">Tên hoặc số điện thoại</label>
          <input id="ops-lookup-query" className={`${inputClass} w-full`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc số điện thoại" />
        </div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy || query.trim().length < 2} onPress={() => void run(async () => {
          const result = await adminService.lookupCustomer(branchId, { q: query.trim() });
          setHits(result.items.map(summarizeCustomer));
          return `Tìm thấy ${result.items.length} khách.`;
        })}>{busy ? "Đang tìm…" : "Tra cứu"}</Button>
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
