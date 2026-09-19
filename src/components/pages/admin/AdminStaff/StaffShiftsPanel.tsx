"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Chip, Modal } from "@heroui/react";
import { useMemo, useState } from "react";
import { todayAtSalon } from "@/lib/salon-date";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminPermission,
  useAdminLeaveRequests,
  useAdminStaffShifts,
  type AdminStaffShift,
} from "@/service";

/**
 * Splits a stored `YYYY-MM-DD` into the two things a roster is read by: the weekday and the
 * day of the month. Parsed at midday UTC on purpose — a bare date read as an instant lands on
 * the previous day in any timezone behind UTC, which would label every shift a day early.
 */
function shiftDay(localDate: string, locale: string): { weekday: string; day: string; month: string } {
  const [year, month, day] = localDate.split("-").map(Number);
  const at = new Date(Date.UTC(year, month - 1, day, 12));
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(at);
  return { weekday: format({ weekday: "short" }), day: String(day), month: format({ month: "short" }) };
}

/** The shift endpoint only accepts quarter-hour boundaries. */
export function isQuarterHour(time: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  return match !== null && Number(match[2]) % 15 === 0;
}

export function StaffShiftsPanel({
  branchId,
  staffId,
}: Readonly<{ branchId: string; staffId: string }>) {
  const t = useTranslations("admin.staff");
  const tc = useTranslations("admin.common");
  const locale = useLocale();
  const canWriteSchedule = useAdminPermission("staff.schedule.write.branch");
  const canRequestLeave = useAdminPermission("staff.schedule.request.own");
  const canApproveLeave = useAdminPermission("staff.schedule.approve.branch");
  const approvalLabel = (code: string) =>
    t.has(`shifts.approval.${code}`) ? t(`shifts.approval.${code}`) : code;
  const requestStatusLabel = (code: string) =>
    t.has(`shifts.requestStatus.${code}`) ? t(`shifts.requestStatus.${code}`) : code;
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
  // Only requests still awaiting a decision are worth counting in the heading: a badge that
  // also counts settled ones stops meaning "there is something to do here".
  const pendingCount = staffLeaveRequests.filter((request) => request.status === "PENDING").length;

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
      notifySuccess(decision === "APPROVE" ? tc("leaveApproved") : tc("leaveRejected"));
      await Promise.all([leaveRequests.mutate(), shifts.mutate()]);
    } catch (thrown) {
      setDecisionError(thrown instanceof Error ? thrown.message : t("shifts.decisionFailed"));
    } finally {
      setDecisionPending(null);
    }
  }

  return (
    <section aria-labelledby="staff-shifts-heading" className="space-y-2">
      {/* Wraps rather than squeezes: the title is four words and carries two text buttons, so on
          a half-width card they used to collide and break the heading over two lines. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h3 id="staff-shifts-heading" className="min-w-0 text-sm font-bold text-admin-ink">{t("shifts.heading")}</h3>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="ghost" isDisabled={!canWriteSchedule} onPress={() => setOpenMode("shift")}>
            <PlusIcon className="size-3.5" />{t("shifts.addShift")}
          </Button>
          <Button size="sm" variant="ghost" isDisabled={!canRequestLeave} onPress={() => setOpenMode("leave")}>
            <CalendarDaysIcon className="size-3.5" />{t("shifts.requestLeave")}
          </Button>
        </div>
      </div>

      {shifts.isLoading ? (
        <p className="text-xs text-admin-muted">{t("shifts.loading")}</p>
      ) : shifts.error ? (
        <p role="alert" className="text-xs text-admin-danger">{t("shifts.loadFailed")}</p>
      ) : staffShifts.length === 0 ? (
        <p className="text-xs text-admin-muted">{t("shifts.empty")}</p>
      ) : (
        <ul className="max-h-48 divide-y divide-admin-border overflow-y-auto rounded-lg border border-admin-border">
          {staffShifts.slice(0, 20).map((shift) => {
            const { weekday, day, month } = shiftDay(shift.localDate, locale);
            return (
              <li key={shift.id} className="flex items-center gap-3 px-2 py-2">
                {/* A roster is scanned by date, so the date becomes a block on the left rather than
                    the head of a run-on string. Weekday and day only: the month sits beside it and
                    the full date is announced once, below, so nothing is said twice. */}
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-admin-soft leading-none"
                >
                  <span className="text-[0.6875rem] text-admin-muted">{weekday}</span>
                  <span className="text-xs font-bold text-admin-ink">{day}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold tabular-nums text-admin-ink">
                    {shift.startLocalTime.slice(0, 5)} → {shift.endLocalTime.slice(0, 5)}
                  </span>
                  <span className="block text-[0.6875rem] text-admin-muted">{month}</span>
                  <span className="sr-only">{shift.localDate.split("-").reverse().join("/")}</span>
                </span>
                <Chip
                  size="sm"
                  variant="soft"
                  color={shift.approvalStatus === "APPROVED" ? "success" : shift.approvalStatus === "REJECTED" ? "danger" : "warning"}
                >
                  <Chip.Label>{approvalLabel(shift.approvalStatus ?? "")}</Chip.Label>
                </Chip>
              </li>
            );
          })}
        </ul>
      )}

      {/* Two different jobs share this card — a roster, and decisions waiting on the manager — so
          a rule separates them, and the count says whether the second one needs attention. */}
      <div className="space-y-2 border-t border-admin-border pt-3">
        <h4 className="flex items-center gap-2 text-xs font-semibold text-admin-ink">
          {t("shifts.requestsHeading")}
          {pendingCount !== 0 ? (
            <Chip size="sm" variant="soft" color="warning">
              <Chip.Label>{pendingCount}</Chip.Label>
            </Chip>
          ) : null}
        </h4>
        {staffLeaveRequests.length === 0 ? (
          <p className="text-xs text-admin-muted">{t("shifts.noRequests")}</p>
        ) : (
          <ul className="space-y-2">
            {staffLeaveRequests.map((request) => (
              <li
                key={request.id}
                className={`rounded-lg border p-2 text-xs ${request.status === "PENDING" ? "border-admin-accent/40 bg-admin-soft" : "border-admin-border"}`}
              >
                <p className="font-semibold tabular-nums text-admin-ink">{request.from?.split("-").reverse().join("/")} → {request.to?.split("-").reverse().join("/")}</p>
                <p className="mt-0.5 text-admin-muted">{request.reason || t("shifts.noReason")} · {requestStatusLabel(request.status)}</p>
                {canApproveLeave && request.status === "PENDING" ? (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="primary" isDisabled={decisionPending === request.id} onPress={() => void decide(request.id, "APPROVE")}>{t("shifts.approve")}</Button>
                    <Button size="sm" variant="outline" isDisabled={decisionPending === request.id} onPress={() => void decide(request.id, "REJECT")}>{t("shifts.reject")}</Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {decisionError ? <p role="alert" className="text-xs text-admin-danger">{decisionError}</p> : null}
      </div>

      {openMode && ((openMode === "shift" && canWriteSchedule) || (openMode === "leave" && canRequestLeave)) ? (
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
  const t = useTranslations("admin.staff");
  const tc = useTranslations("admin.common");
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
      notifySuccess(mode === "shift" ? tc("shiftCreated") : tc("leaveRequested"));
      onSaved();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : t("shifts.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {mode === "shift" ? t("shifts.addShift") : t("shifts.requestLeave")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("shifts.date")}</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("shifts.start")}</span>
                  <input
                    type="time"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("shifts.end")}</span>
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
                  {t("shifts.timeValidation")}
                </p>
              ) : null}
              {mode === "leave" ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("shifts.reason")}</span>
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
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>{t("shifts.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={!canSubmit}
              >
                {busy ? t("shifts.saving") : t("shifts.save")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
