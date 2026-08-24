"use client";

import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { Button, Card, Modal } from "@heroui/react";
import { useState } from "react";
import { formatVnd } from "@/lib/admin-format";
import {
  adminService,
  useAdminAppointmentPayments,
  useAdminPaymentRefund,
  type AdminAppointmentPayment,
} from "@/service";

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// A payment can only be refunded once it has actually settled. Anything still
// pending / failed stays read-only so the salon never refunds a charge the
// backend hasn't captured.
function isRefundable(status: string): boolean {
  const upper = status.toUpperCase();
  return upper.includes("PAID") || upper.includes("SETTLED") || upper.includes("CAPTURED") || upper.includes("SUCCE");
}

export function RefundPanel({
  branchId,
  appointmentId,
}: Readonly<{ branchId: string; appointmentId: string }>) {
  const { data, isLoading, error, mutate } = useAdminAppointmentPayments(branchId, appointmentId);
  const payments = data?.items ?? [];
  const [refunding, setRefunding] = useState<AdminAppointmentPayment | null>(null);
  // Latest refund created this session, so we can echo its settled status back
  // from the GET refund-by-id endpoint.
  const [lastRefund, setLastRefund] = useState<{ paymentId: string; refundId: string } | null>(null);

  return (
    <Card className="mt-4 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex items-center gap-2 border-b border-admin-border px-4 py-3">
        <ArrowUturnLeftIcon className="size-5 text-admin-accent" />
        <h2 className="font-bold text-admin-ink">Hoàn tiền</h2>
      </Card.Header>
      <Card.Content className="p-4">
        {isLoading ? (
          <p className="text-xs text-admin-muted">Đang tải danh sách giao dịch…</p>
        ) : error ? (
          <p role="alert" className="text-xs text-admin-danger">Không tải được giao dịch của lịch hẹn này.</p>
        ) : payments.length === 0 ? (
          <p className="text-xs text-admin-muted">Lịch hẹn này chưa có giao dịch nào để hoàn tiền.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => {
              const refundable = isRefundable(payment.status);
              return (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-admin-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <strong className="text-admin-ink">{formatVnd(payment.amountVnd)}</strong>
                    <span className="ml-2 text-xs text-admin-muted">{payment.method}</span>
                    <span className="ml-2 text-xs text-admin-muted">{fmtDate(payment.paidAt)}</span>
                    <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-admin-muted">{payment.status}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-admin-accent/40 text-admin-accent"
                    isDisabled={!refundable}
                    onPress={() => setRefunding(payment)}
                  >
                    Hoàn tiền
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {lastRefund ? (
          <RefundReceipt
            branchId={branchId}
            paymentId={lastRefund.paymentId}
            refundId={lastRefund.refundId}
          />
        ) : null}
      </Card.Content>

      {refunding ? (
        <RefundDialog
          branchId={branchId}
          payment={refunding}
          onClose={() => setRefunding(null)}
          onRefunded={(refundId, paymentId) => {
            setLastRefund({ paymentId, refundId });
            void mutate();
          }}
        />
      ) : null}
    </Card>
  );
}

// Reads the created refund back through the GET refund-by-id endpoint so the
// panel shows the backend-authoritative status rather than the optimistic one.
function RefundReceipt({
  branchId,
  paymentId,
  refundId,
}: Readonly<{ branchId: string; paymentId: string; refundId: string }>) {
  const { data, error } = useAdminPaymentRefund(branchId, paymentId, refundId);
  return (
    <div className="mt-3 rounded-lg border border-admin-success/40 bg-admin-soft px-3 py-2 text-xs">
      {error ? (
        <span className="text-admin-danger">Đã tạo yêu cầu hoàn tiền nhưng không đọc lại được trạng thái.</span>
      ) : data ? (
        <span className="text-admin-ink">
          Đã hoàn <strong>{formatVnd(data.amountVnd)}</strong> — trạng thái: {data.status}
          {data.reason ? ` · ${data.reason}` : ""}
        </span>
      ) : (
        <span className="text-admin-muted">Đang xác nhận trạng thái hoàn tiền…</span>
      )}
    </div>
  );
}

function RefundDialog({
  branchId,
  payment,
  onClose,
  onRefunded,
}: Readonly<{
  branchId: string;
  payment: AdminAppointmentPayment;
  onClose: () => void;
  onRefunded: (refundId: string, paymentId: string) => void;
}>) {
  const [amount, setAmount] = useState(String(payment.amountVnd));
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number(amount.replace(/\D/g, ""));
  const amountValid = numericAmount > 0 && numericAmount <= payment.amountVnd;
  const canContinue = amountValid && reason.trim().length > 0 && !busy;

  async function submit() {
    if (!canContinue) return;
    setBusy(true);
    setError(null);
    try {
      const refund = await adminService.refundPayment(branchId, payment.id, {
        amountVnd: numericAmount,
        reason: reason.trim(),
      });
      onRefunded(refund.id, payment.id);
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không hoàn được tiền.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {confirming ? "Xác nhận hoàn tiền" : "Hoàn tiền giao dịch"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              {confirming ? (
                <div className="space-y-3">
                  <p className="text-admin-ink">
                    Bạn sắp hoàn <strong className="text-admin-danger">{formatVnd(numericAmount)}</strong> cho
                    giao dịch <strong>{formatVnd(payment.amountVnd)}</strong> ({payment.method}).
                  </p>
                  <p className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-muted">Lý do: {reason.trim()}</p>
                  <p className="text-xs text-admin-danger">Thao tác này đụng tiền thật và không thể hoàn tác.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-muted">
                    Giao dịch gốc: <strong className="text-admin-ink">{formatVnd(payment.amountVnd)}</strong> · {payment.method}
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-admin-ink">Số tiền hoàn (VND)</span>
                    <input
                      inputMode="numeric"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    />
                    {!amountValid && amount.trim().length > 0 ? (
                      <span className="text-[0.7rem] text-admin-danger">
                        Số tiền hoàn phải lớn hơn 0 và không vượt quá {formatVnd(payment.amountVnd)}.
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-admin-ink">Lý do hoàn tiền</span>
                    <input
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    />
                  </label>
                </>
              )}
              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              {confirming ? (
                <>
                  <Button variant="ghost" className="rounded-lg" onPress={() => setConfirming(false)} isDisabled={busy}>
                    Quay lại
                  </Button>
                  <Button
                    variant="primary"
                    className="rounded-lg bg-danger text-white"
                    onPress={() => void submit()}
                    isDisabled={busy}
                  >
                    {busy ? "Đang hoàn tiền…" : "Xác nhận hoàn tiền"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>Huỷ</Button>
                  <Button
                    variant="primary"
                    className="rounded-lg"
                    onPress={() => setConfirming(true)}
                    isDisabled={!canContinue}
                  >
                    Tiếp tục
                  </Button>
                </>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
