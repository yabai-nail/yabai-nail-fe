"use client";

import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useMemo, useState } from "react";
import { todayAtSalon } from "@/lib/salon-date";
import {
  adminService,
  useAdminLeaveRequests,
  useAdminStaffShifts,
  type AdminStaffShift,
} from "@/service";

/** The shift endpoint only accepts quarter-hour boundaries. */
export function isQuarterHour(time: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  return match !== null && Number(match[2]) % 15 === 0;
}

export function StaffShiftsPanel({
  branchId,
  staffId,
}: Readonly<{ branchId: string; staffId: string }>) {
  const shifts = useAdminStaffShifts(branchId);
  const leaveRequests = useAdminLeaveRequests(branchId);
  const staffShifts = useMemo(
    () => ((shifts.data?.items ?? []) as AdminStaffShift[]).filter((shift) => shift.staffId === staffId),
    [shifts.data, staffId],
  );

  const [openMode, setOpenMode] = useState<"shift" | "leave" | null>(null);
  const [decisionPending, setDecisionPending] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const staffLeaveRequests = (leaveRequests.data?.items ?? []).filter((request) => request.staffId === staffId);

  async function decide(requestId: string, decision: "APPROVE" | "REJECT") {
    setDecisionPending(requestId);
    setDecisionError(null);
    try {
      await adminService.decideLeaveRequest(
        branchId,
        requestId,
        decision === "APPROVE"
          ? { decision, resolution: { action: "CANCEL" } }
          : { decision },
      );
      await Promise.all([leaveRequests.mutate(), shifts.mutate()]);
    } catch (thrown) {
      setDecisionError(thrown instanceof Error ? thrown.message : "Không xử lý được yêu cầu nghỉ.");
    } finally {
      setDecisionPending(null);
    }
  }

  return (
    <section aria-labelledby="staff-shifts-heading" className="space-y-2 border-t border-admin-border pt-4">
      <div className="flex items-center justify-between">
        <h3 id="staff-shifts-heading" className="text-sm font-bold text-admin-ink">Ca làm và ngày nghỉ</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onPress={() => setOpenMode("shift")}>
            <PlusIcon className="size-3.5" />Thêm ca
          </Button>
          <Button size="sm" variant="ghost" onPress={() => setOpenMode("leave")}>
            <CalendarDaysIcon className="size-3.5" />Xin nghỉ
          </Button>
        </div>
      </div>

      {shifts.isLoading ? (
        <p className="text-xs text-admin-muted">Đang tải ca…</p>
      ) : shifts.error ? (
        <p role="alert" className="text-xs text-admin-danger">Không tải được ca làm.</p>
      ) : staffShifts.length === 0 ? (
        <p className="text-xs text-admin-muted">Chưa có ca nào cho nhân viên này.</p>
      ) : (
        <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-admin-border p-2 text-xs">
          {staffShifts.slice(0, 20).map((shift) => (
            <li key={shift.id} className="flex items-center justify-between gap-2">
              <span className="text-admin-ink">{shift.localDate.split("-").reverse().join("/")} · {shift.startLocalTime.slice(0, 5)} → {shift.endLocalTime.slice(0, 5)}</span>
              <span className="text-[0.65rem] text-admin-muted">{{ APPROVED: "Đã duyệt", PENDING: "Chờ duyệt", REJECTED: "Từ chối" }[shift.approvalStatus ?? ""] ?? shift.approvalStatus ?? ""}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-admin-ink">Yêu cầu nghỉ</h4>
        {staffLeaveRequests.length === 0 ? (
          <p className="text-xs text-admin-muted">Chưa có yêu cầu nghỉ.</p>
        ) : (
          <ul className="space-y-2">
            {staffLeaveRequests.map((request) => (
              <li key={request.id} className="rounded-lg border border-admin-border p-2 text-xs">
                <p className="text-admin-ink">{request.from?.split("-").reverse().join("/")} → {request.to?.split("-").reverse().join("/")}</p>
                <p className="text-admin-muted">{request.reason || "Không có lý do"} · {{ PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Đã từ chối" }[request.status] ?? request.status}</p>
                {request.status === "PENDING" ? (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="primary" isDisabled={decisionPending === request.id} onPress={() => void decide(request.id, "APPROVE")}>Duyệt (hủy lịch trùng)</Button>
                    <Button size="sm" variant="outline" isDisabled={decisionPending === request.id} onPress={() => void decide(request.id, "REJECT")}>Từ chối</Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {decisionError ? <p role="alert" className="text-xs text-admin-danger">{decisionError}</p> : null}
      </div>

      {openMode ? (
        <ShiftOrLeaveDialog
          branchId={branchId}
          staffId={staffId}
          mode={openMode}
          onClose={() => setOpenMode(null)}
          onSaved={() => { void shifts.mutate(); void leaveRequests.mutate(); }}
        />
      ) : null}
    </section>
  );
}

function ShiftOrLeaveDialog({
  branchId,
  staffId,
  mode,
  onClose,
  onSaved,
}: Readonly<{
  branchId: string;
  staffId: string;
  mode: "shift" | "leave";
  onClose: () => void;
  onSaved: () => void;
}>) {
  const today = todayAtSalon();
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quarter-hour and ordering are backend rules; check them here so the admin
  // is told before submitting rather than after a 422.
  const timesValid =
    mode === "leave" || (isQuarterHour(start) && isQuarterHour(end) && end > start);
  const canSubmit =
    !busy &&
    Boolean(date && start && end) &&
    timesValid &&
    (mode === "shift" || reason.trim().length > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "shift") {
        // The endpoint takes the branch's local date and wall-clock times, not
        // absolute instants — it resolves them against the branch timezone
        // itself. Sending startsAt/endsAt left localDate and the two times
        // empty, so every save came back "Ngay, khoang ca hoac nhan vien
        // khong hop le."
        await adminService.createStaffShift(branchId, {
          staffId,
          localDate: date,
          startLocalTime: start,
          endLocalTime: end,
          type: "WORK",
        });
      } else {
        // Leave is whole days: from/to, plus a reason the backend requires.
        await adminService.createLeaveRequest(branchId, {
          staffId,
          from: date,
          to: date,
          reason: reason.trim(),
        });
      }
      onSaved();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không lưu được.");
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
                {mode === "shift" ? "Thêm ca làm" : "Đăng ký nghỉ"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Ngày</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">Bắt đầu</span>
                  <input
                    type="time"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">Kết thúc</span>
                  <input
                    type="time"
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  />
                </label>
              </div>
              {mode === "shift" && !timesValid ? (
                <p className="text-xs text-admin-muted">
                  Giờ bắt đầu và kết thúc phải rơi vào mốc 15 phút (00, 15, 30, 45), và giờ kết thúc phải sau giờ bắt đầu.
                </p>
              ) : null}
              {mode === "leave" ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">Lý do</span>
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  />
                </label>
              ) : null}
              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>Huỷ</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={!canSubmit}
              >
                {busy ? "Đang lưu…" : "Lưu"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
