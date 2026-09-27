"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Chip, Modal } from "@heroui/react";
import { useMemo, useState } from "react";
import { todayAtSalon } from "@/lib/salon-date";
import { notifySuccess } from "@/lib/app-toast";
import { AdminDateField } from "@/components/blocks/admin/AdminDateField";
import { AdminTimeField } from "@/components/blocks/admin/AdminTimeField";
import {
  adminService,
  useAdminPermission,
  useAdminLeaveRequests,
  useAdminStaffShifts,
  type AdminStaffShift,
} from "@/service";
import {
  createShiftsInOrder,
  expandShiftDates,
  MAX_SHIFT_DAYS,
  monthRange,
  nextMonthRange,
  weekRange,
} from "./shift-dates";
import { ShiftDayCalendar } from "./ShiftDayCalendar";

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
  const takenDates = useMemo(
    () => new Set(staffShifts.filter((shift) => shift.type !== "LEAVE" && shift.approvalStatus === "APPROVED").map((shift) => shift.localDate)),
    [staffShifts],
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
          takenDates={takenDates}
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
  takenDates,
  onClose,
  onSaved,
}: Readonly<{
  branchId: string;
  staffId: string;
  mode: "shift" | "leave";
  takenDates: ReadonlySet<string>;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.staff");
  const tc = useTranslations("admin.common");
  const today = todayAtSalon();
  const [date, setDate] = useState(today);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(() => new Set());
  const [visibleMonth, setVisibleMonth] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
  }));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const shiftDates = [...selectedDays].sort();
  const tooManyDays = shiftDates.length > MAX_SHIFT_DAYS;
  // Quarter-hour and ordering are backend rules; check them here so the admin
  // is told before submitting rather than after a 422.
  const timesValid = isQuarterHour(start) && isQuarterHour(end) && end > start;
  const canSubmit =
    !busy &&
    (mode === "shift"
      ? timesValid && shiftDates.length > 0 && !tooManyDays
      : Boolean(date) && reason.trim().length > 0);

  const quickRanges = [
    { key: "quickWeek", range: weekRange(today) },
    { key: "quickMonth", range: monthRange(today) },
    { key: "quickNextMonth", range: nextMonthRange(today) },
  ] as const;

  function pickRange(range: { from: string; to: string }) {
    const every = [0, 1, 2, 3, 4, 5, 6];
    setSelectedDays(new Set(expandShiftDates(range.from, range.to, every).filter((day) => !takenDates.has(day))));
    setVisibleMonth({ year: Number(range.from.slice(0, 4)), month: Number(range.from.slice(5, 7)) - 1 });
  }

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      if (mode === "shift") {
        // The endpoint takes the branch's local date and wall-clock times, not
        // absolute instants — it resolves them against the branch timezone
        // itself. Sending startsAt/endsAt left localDate and the two times
        // empty, so every save came back "Ngay, khoang ca hoac nhan vien
        // khong hop le."
        const result = await createShiftsInOrder(shiftDates, async (localDate) => {
          await adminService.createStaffShift(branchId, {
            staffId,
            localDate,
            startLocalTime: start,
            endLocalTime: end,
            type: "WORK",
          });
          setProgress((done) => done + 1);
        });
        if (result.created.length) onSaved();
        if (result.error) {
          const message = result.error instanceof Error ? result.error.message : t("shifts.saveFailed");
          setError(result.created.length ? t("shifts.batchStopped", { created: result.created.length, message }) : message);
          return;
        }
        if (!result.created.length) {
          setError(t("shifts.allSkipped"));
          return;
        }
        notifySuccess(
          result.skipped.length
            ? tc("shiftsCreatedSkipped", { created: result.created.length, skipped: result.skipped.length })
            : tc("shiftsCreated", { created: result.created.length }),
        );
      } else {
        // Leave is whole days: from/to, plus a reason the backend requires.
        await adminService.createLeaveRequest(branchId, {
          staffId,
          from: date,
          to: date,
          reason: reason.trim(),
        });
        notifySuccess(tc("leaveRequested"));
        onSaved();
      }
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
            <Modal.Body className="grid gap-5 px-5 py-4 text-sm">
              {mode === "shift" ? (
                <>
                  <section className="grid gap-2">
                    <h4 className="text-sm font-bold text-admin-ink">{t("shifts.hours")}</h4>
                    <div className="flex items-center gap-2">
                      <AdminTimeField ariaLabel={t("shifts.start")} value={start} onChange={setStart} />
                      <span aria-hidden="true" className="text-admin-muted">→</span>
                      <AdminTimeField ariaLabel={t("shifts.end")} value={end} onChange={setEnd} />
                    </div>
                    {timesValid ? null : (
                      <p className="text-xs text-admin-danger">{t("shifts.timeValidation")}</p>
                    )}
                  </section>
                  <section className="grid gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-admin-ink">{t("shifts.pickDays")}</h4>
                      <p className="text-xs text-admin-muted">{t("shifts.pickDaysHint")}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickRanges.map(({ key, range }) => (
                        <Button key={key} size="sm" variant="outline" className="rounded-full" onPress={() => pickRange(range)}>
                          {t(`shifts.${key}`)}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        isDisabled={selectedDays.size === 0}
                        onPress={() => setSelectedDays(new Set())}
                      >
                        {t("shifts.clearDays")}
                      </Button>
                    </div>
                    <ShiftDayCalendar
                      month={visibleMonth}
                      onMonthChange={setVisibleMonth}
                      selected={selectedDays}
                      onSelectedChange={setSelectedDays}
                      today={today}
                      takenDates={takenDates}
                    />
                  </section>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-admin-ink">{t("shifts.date")}</span>
                    <AdminDateField ariaLabel={t("shifts.date")} value={date} onChange={setDate} />
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-admin-ink">{t("shifts.reason")}</span>
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
            <Modal.Footer className="flex items-center justify-between gap-2 border-t border-admin-border px-5 py-3">
              <p aria-live="polite" className={`text-xs font-semibold ${tooManyDays ? "text-admin-danger" : "text-admin-muted"}`}>
                {mode === "shift"
                  ? tooManyDays
                    ? t("shifts.tooManyDays", { max: MAX_SHIFT_DAYS })
                    : t("shifts.selectedCount", { count: shiftDates.length })
                  : null}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>{t("shifts.cancel")}</Button>
                <Button
                  variant="primary"
                  className="rounded-lg"
                  onPress={() => void submit()}
                  isDisabled={!canSubmit}
                >
                  {busy
                    ? mode === "shift" && shiftDates.length > 1
                      ? t("shifts.savingProgress", { done: progress, total: shiftDates.length })
                      : t("shifts.saving")
                    : mode === "shift" && shiftDates.length > 0
                      ? t("shifts.saveCount", { count: shiftDates.length })
                      : t("shifts.save")}
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
