"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { adminService, useAdminBranch } from "@/service";
import {
  formatVnd,
  parseVnd,
  summarizeCheckIn,
  summarizeCustomer,
  summarizeMembership,
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
        <LeaveDecisionForm branchId={branchId} />
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
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { busy, message, error, run } = useAction();
  const amountVnd = parseVnd(amount);
  const disabled = busy || !paymentId.trim() || amountVnd <= 0 || reason.trim().length < 2;

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Hoàn tiền</h2>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-refund-payment">ID thanh toán</label>
        <input id="ops-refund-payment" className={inputClass} value={paymentId} onChange={(event) => setPaymentId(event.target.value)} placeholder="ID thanh toán" />
      </div>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-refund-amount">Số tiền hoàn (VND)</label>
        <input id="ops-refund-amount" className={inputClass} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Số tiền hoàn (VND)" inputMode="numeric" />
      </div>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-refund-reason">Lý do hoàn</label>
        <input id="ops-refund-reason" className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do hoàn" />
      </div>
      <Feedback message={message} error={error} />
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={disabled} onPress={() => void run(async () => {
          await adminService.refundPayment(branchId, paymentId.trim(), { amountVnd, reason: reason.trim() });
          return "Đã ghi nhận hoàn tiền.";
        })}>{busy ? "Đang xử lý…" : "Hoàn tiền"}</Button>
      </div>
    </Card>
  );
}

function LeaveDecisionForm({ branchId }: Readonly<{ branchId: string }>) {
  const [requestId, setRequestId] = useState("");
  const [note, setNote] = useState("");
  const { busy, message, error, run } = useAction();
  const disabled = busy || !requestId.trim();

  const decide = (decision: "approve" | "reject") =>
    void run(async () => {
      await adminService.decideLeaveRequest(branchId, requestId.trim(), { decision, note: note.trim() || undefined });
      return decision === "approve" ? "Đã duyệt nghỉ phép." : "Đã từ chối nghỉ phép.";
    });

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Duyệt nghỉ phép</h2>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-leave-request">ID yêu cầu nghỉ</label>
        <input id="ops-leave-request" className={inputClass} value={requestId} onChange={(event) => setRequestId(event.target.value)} placeholder="ID yêu cầu nghỉ" />
      </div>
      <div className="grid gap-1">
        <label className={labelClass} htmlFor="ops-leave-note">Ghi chú (tuỳ chọn)</label>
        <input id="ops-leave-note" className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú (tuỳ chọn)" />
      </div>
      <Feedback message={message} error={error} />
      <div className="flex gap-2">
        <Button variant="primary" className="rounded-lg" isDisabled={disabled} onPress={() => decide("approve")}>Duyệt</Button>
        <Button variant="outline" className="rounded-lg" isDisabled={disabled} onPress={() => decide("reject")}>Từ chối</Button>
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
        Hạng {customer.tier} · {customer.points.toLocaleString("vi-VN")} điểm
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
                  <span className="font-mono text-admin-muted">{formatVnd(appointment.totalVnd)}</span>
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
