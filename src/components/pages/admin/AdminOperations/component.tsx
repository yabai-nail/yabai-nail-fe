"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { adminService, useAdminBranch } from "@/service";
import { parseVnd, summarizeCustomer, type CustomerHit } from "./data";

const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";

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
      <input className={inputClass} value={paymentId} onChange={(event) => setPaymentId(event.target.value)} placeholder="ID thanh toán" />
      <input className={inputClass} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Số tiền hoàn (VND)" inputMode="numeric" />
      <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do hoàn" />
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
      <input className={inputClass} value={requestId} onChange={(event) => setRequestId(event.target.value)} placeholder="ID yêu cầu nghỉ" />
      <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú (tuỳ chọn)" />
      <Feedback message={message} error={error} />
      <div className="flex gap-2">
        <Button variant="primary" className="rounded-lg" isDisabled={disabled} onPress={() => decide("approve")}>Duyệt</Button>
        <Button variant="outline" className="rounded-lg" isDisabled={disabled} onPress={() => decide("reject")}>Từ chối</Button>
      </div>
    </Card>
  );
}

function CheckInForm({ branchId }: Readonly<{ branchId: string }>) {
  const [code, setCode] = useState("");
  const { busy, message, error, run } = useAction();

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Xử lý check-in</h2>
      <input className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Mã check-in hoặc SĐT" />
      <Feedback message={message} error={error} />
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy || !code.trim()} onPress={() => void run(async () => {
          await adminService.resolveCheckIn(branchId, /^0\d{9}$/.test(code.trim()) ? { phone: code.trim() } : { code: code.trim() });
          return "Đã xử lý check-in.";
        })}>{busy ? "Đang xử lý…" : "Xử lý"}</Button>
      </div>
    </Card>
  );
}

function MembershipForm({ branchId }: Readonly<{ branchId: string }>) {
  const [code, setCode] = useState("");
  const { busy, message, error, run } = useAction();

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Xử lý thẻ thành viên</h2>
      <input className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Mã thẻ / QR token" />
      <Feedback message={message} error={error} />
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy || !code.trim()} onPress={() => void run(async () => {
          await adminService.resolveMembershipCard(branchId, { code: code.trim() });
          return "Đã xử lý thẻ thành viên.";
        })}>{busy ? "Đang xử lý…" : "Xử lý"}</Button>
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
      <div className="flex gap-2">
        <input className={`${inputClass} flex-1`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc số điện thoại" />
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
