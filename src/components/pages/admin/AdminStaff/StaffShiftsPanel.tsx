"use client";

import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  adminService,
  useAdminStaffShifts,
  type AdminLeaveRequest,
  type AdminStaffShift,
} from "@/service";

const TZ_OFFSET_TOKYO = "+09:00";

function toIso(date: string, time: string): string {
  return `${date}T${time}:00${TZ_OFFSET_TOKYO}`;
}

function fmt(iso: string): string {
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

export function StaffShiftsPanel({
  branchId,
  staffId,
}: Readonly<{ branchId: string; staffId: string }>) {
  const shifts = useAdminStaffShifts(branchId);
  const staffShifts = useMemo(
    () => ((shifts.data?.items ?? []) as AdminStaffShift[]).filter((shift) => shift.staffId === staffId),
    [shifts.data, staffId],
  );

  const [openMode, setOpenMode] = useState<"shift" | "leave" | null>(null);
  // The backend exposes no list endpoint for leave requests (only create +
  // decision), so the approval queue is seeded from requests raised in this
  // session. Each one carries the real id the decision endpoint needs.
  const [pendingLeaves, setPendingLeaves] = useState<ReadonlyArray<AdminLeaveRequest>>([]);

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
              <span className="text-admin-ink">{fmt(shift.startsAt)} → {fmt(shift.endsAt)}</span>
              <span className="text-[0.65rem] text-admin-muted">{shift.status ?? ""}</span>
            </li>
          ))}
        </ul>
      )}

      {pendingLeaves.length > 0 ? (
        <LeaveDecisionList
          branchId={branchId}
          requests={pendingLeaves}
          onDecided={(requestId, status) =>
            setPendingLeaves((current) =>
              current.map((request) =>
                request.id === requestId ? { ...request, status } : request,
              ),
            )
          }
        />
      ) : null}

      {openMode ? (
        <ShiftOrLeaveDialog
          branchId={branchId}
          staffId={staffId}
          mode={openMode}
          onClose={() => setOpenMode(null)}
          onSaved={() => void shifts.mutate()}
          onLeaveCreated={(request) =>
            setPendingLeaves((current) => [request, ...current])
          }
        />
      ) : null}
    </section>
  );
}

// Approve / reject freshly-raised leave requests. Decision revalidates the
// shifts feed because an approval frees the staff member's slot.
function LeaveDecisionList({
  branchId,
  requests,
  onDecided,
}: Readonly<{
  branchId: string;
  requests: ReadonlyArray<AdminLeaveRequest>;
  onDecided: (requestId: string, status: string) => void;
}>) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(requestId: string, decision: "approve" | "reject") {
    setBusyId(requestId);
    setError(null);
    try {
      const updated = await adminService.decideLeaveRequest(branchId, requestId, { decision });
      onDecided(requestId, updated.status);
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không xử lý được yêu cầu nghỉ.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-admin-border p-2">
      <p className="text-[0.65rem] uppercase tracking-wide text-admin-muted">Yêu cầu nghỉ (phiên này)</p>
      <ul className="space-y-1 text-xs">
        {requests.map((request) => {
          const decided = request.status.toUpperCase() !== "PENDING";
          return (
            <li key={request.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 text-admin-ink">
                {fmt(request.startsAt)} → {fmt(request.endsAt)}
                {request.reason ? <span className="ml-1 text-admin-muted">· {request.reason}</span> : null}
              </span>
              {decided ? (
                <span className="text-[0.65rem] uppercase tracking-wide text-admin-muted">{request.status}</span>
              ) : (
                <span className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-admin-success"
                    isDisabled={busyId === request.id}
                    onPress={() => void decide(request.id, "approve")}
                  >
                    Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-admin-danger"
                    isDisabled={busyId === request.id}
                    onPress={() => void decide(request.id, "reject")}
                  >
                    Từ chối
                  </Button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
    </div>
  );
}

function ShiftOrLeaveDialog({
  branchId,
  staffId,
  mode,
  onClose,
  onSaved,
  onLeaveCreated,
}: Readonly<{
  branchId: string;
  staffId: string;
  mode: "shift" | "leave";
  onClose: () => void;
  onSaved: () => void;
  onLeaveCreated: (request: AdminLeaveRequest) => void;
}>) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !busy && date && start && end && (mode === "shift" || reason.trim().length > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "shift") {
        await adminService.createStaffShift(branchId, {
          staffId,
          startsAt: toIso(date, start),
          endsAt: toIso(date, end),
        });
      } else {
        const request = await adminService.createLeaveRequest(branchId, {
          staffId,
          startsAt: toIso(date, start),
          endsAt: toIso(date, end),
          reason: reason.trim(),
        });
        onLeaveCreated(request);
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
