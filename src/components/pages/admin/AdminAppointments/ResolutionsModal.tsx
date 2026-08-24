"use client";

import { Button, Modal, Tabs } from "@heroui/react";
import { useState } from "react";
import { adminService } from "@/service";

type Mode = "check-in" | "membership";

// Front-desk resolutions: match a walk-in to a booking (check-in) or look up a
// membership card by code / QR. Both are branch-scoped POSTs that return a
// resolved customer; a successful check-in revalidates the calendar.
export function ResolutionsModal({
  branchId,
  onClose,
  onCheckInResolved,
}: Readonly<{
  branchId: string;
  onClose: () => void;
  onCheckInResolved: () => void;
}>) {
  const [mode, setMode] = useState<Mode>("check-in");

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">Xử lý tại quầy</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-5 py-4 text-sm">
              <Tabs selectedKey={mode} onSelectionChange={(key) => setMode(String(key) as Mode)} variant="secondary">
                <Tabs.ListContainer className="mb-4 overflow-x-auto">
                  <Tabs.List aria-label="Loại xử lý">
                    <Tabs.Tab id="check-in"><span className="px-1 text-sm">Nhận khách (check-in)</span><Tabs.Indicator /></Tabs.Tab>
                    <Tabs.Tab id="membership"><span className="px-1 text-sm">Thẻ thành viên</span><Tabs.Indicator /></Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
              {mode === "check-in" ? (
                <CheckInForm branchId={branchId} onResolved={onCheckInResolved} />
              ) : (
                <MembershipForm branchId={branchId} />
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Đóng</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function CheckInForm({
  branchId,
  onResolved,
}: Readonly<{ branchId: string; onResolved: () => void }>) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const canSubmit = !busy && (phone.trim().length > 0 || code.trim().length > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const resolution = await adminService.resolveCheckIn(branchId, {
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(code.trim() ? { code: code.trim() } : {}),
      });
      setResult(
        `Trạng thái: ${resolution.status}` +
          (resolution.appointmentId ? ` · Lịch hẹn ${resolution.appointmentId.slice(0, 8)}` : ""),
      );
      onResolved();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không xử lý được check-in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-admin-ink">Số điện thoại</span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="0900000000"
          className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-admin-ink">Mã check-in</span>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
        />
      </label>
      <p className="text-[0.7rem] text-admin-muted">Nhập số điện thoại hoặc mã để nhận khách vào lịch hẹn.</p>
      {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
      {result ? <p className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-ink">{result}</p> : null}
      <Button variant="primary" className="rounded-lg" onPress={() => void submit()} isDisabled={!canSubmit}>
        {busy ? "Đang xử lý…" : "Nhận khách"}
      </Button>
    </div>
  );
}

function MembershipForm({ branchId }: Readonly<{ branchId: string }>) {
  const [code, setCode] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const canSubmit = !busy && (code.trim().length > 0 || qrToken.trim().length > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const resolution = await adminService.resolveMembershipCard(branchId, {
        ...(code.trim() ? { code: code.trim() } : {}),
        ...(qrToken.trim() ? { qrToken: qrToken.trim() } : {}),
      });
      setResult(
        `Trạng thái: ${resolution.status}` +
          (resolution.tier ? ` · Hạng ${resolution.tier}` : "") +
          (resolution.customerId ? ` · Khách ${resolution.customerId.slice(0, 8)}` : ""),
      );
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không tra được thẻ thành viên.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-admin-ink">Mã thẻ</span>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-admin-ink">QR token</span>
        <input
          value={qrToken}
          onChange={(event) => setQrToken(event.target.value)}
          className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
        />
      </label>
      <p className="text-[0.7rem] text-admin-muted">Nhập mã thẻ hoặc QR để tra thông tin thành viên.</p>
      {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
      {result ? <p className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-ink">{result}</p> : null}
      <Button variant="primary" className="rounded-lg" onPress={() => void submit()} isDisabled={!canSubmit}>
        {busy ? "Đang tra…" : "Tra thẻ"}
      </Button>
    </div>
  );
}
