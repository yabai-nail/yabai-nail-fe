"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  cancelAppointment,
  createAppointment,
  filterAppointments,
  getAppointmentsInRange,
  getAppointmentSummary,
  updateAppointment,
} from "./appointment-state";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { AppointmentDetailPanel } from "./AppointmentDetailPanel";
import { AppointmentFormModal } from "./AppointmentFormModal";
import { AppointmentList } from "./AppointmentList";
import { AppointmentSummary } from "./AppointmentSummary";
import { AppointmentToolbar } from "./AppointmentToolbar";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";
import {
  DEFAULT_APPOINTMENT_DATE,
  initialAppointments,
  type Appointment,
  type AppointmentDraft,
  type AppointmentStatusFilter,
  type AppointmentView,
} from "./data";
import {
  formatAppointmentDateLabel,
  getAppointmentViewRange,
  shiftAppointmentDate,
} from "./date-utils";

export function AdminAppointmentsComponent() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<ReadonlyArray<Appointment>>(initialAppointments);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_APPOINTMENT_DATE);
  const [view, setView] = useState<AppointmentView>("day");
  const [status, setStatus] = useState<AppointmentStatusFilter>("all");
  const [selectedId, setSelectedId] = useState(initialAppointments[0]?.id ?? "");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const localId = useRef(initialAppointments.length + 1);
  const visibleDayAppointments = useMemo(
    () => filterAppointments(appointments, { date: selectedDate, status }),
    [appointments, selectedDate, status],
  );
  const viewRange = useMemo(
    () => getAppointmentViewRange(selectedDate, view),
    [selectedDate, view],
  );
  const visibleCalendarAppointments = useMemo(() => {
    const inRange = getAppointmentsInRange(appointments, viewRange.start, viewRange.end);
    return status === "all" ? inRange : inRange.filter((appointment) => appointment.status === status);
  }, [appointments, status, viewRange]);
  const selectedAppointment = resolveVisibleSelection(visibleCalendarAppointments, selectedId);
  const summary = useMemo(
    () => getAppointmentSummary(filterAppointments(appointments, { date: selectedDate, status: "all" })),
    [appointments, selectedDate],
  );

  function moveDate(direction: -1 | 1) {
    setSelectedDate((date) => shiftAppointmentDate(date, view, direction));
  }

  function saveAppointment(draft: AppointmentDraft) {
    if (formMode === "edit" && selectedAppointment) {
      setAppointments((current) => updateAppointment(current, selectedAppointment.id, draft));
    } else {
      const id = `appointment-local-${localId.current++}`;
      setAppointments((current) => createAppointment(current, draft, id));
      setSelectedId(id);
      setSelectedDate(draft.date);
    }
    setFormMode(null);
  }

  function confirmCancel() {
    if (!selectedAppointment) return;
    setAppointments((current) => cancelAppointment(current, selectedAppointment.id));
    setIsCancelOpen(false);
  }

  return (
    <AdminPageLayout>
      <AppointmentToolbar
        dateLabel={formatAppointmentDateLabel(selectedDate, view)}
        view={view}
        status={status}
        onPrevious={() => moveDate(-1)}
        onNext={() => moveDate(1)}
        onToday={() => setSelectedDate(DEFAULT_APPOINTMENT_DATE)}
        onViewChange={setView}
        onStatusChange={setStatus}
        onCreate={() => setFormMode("create")}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,21rem)_minmax(0,1fr)] 2xl:grid-cols-[20rem_minmax(0,1fr)_20rem]">
        <section className="min-w-0" aria-label="Danh sách và tổng quan lịch hẹn">
          <AppointmentList appointments={visibleDayAppointments} selectedId={selectedAppointment?.id ?? null} onSelect={setSelectedId} />
          <AppointmentSummary summary={summary} />
        </section>

        <AppointmentCalendar
          view={view}
          appointments={visibleCalendarAppointments}
          selectedDate={selectedDate}
          selectedId={selectedAppointment?.id ?? null}
          onSelect={setSelectedId}
        />

        <div className="2xl:block">
          {selectedAppointment ? (
            <AppointmentDetailPanel
              appointment={selectedAppointment}
              onEdit={() => setFormMode("edit")}
              onCancel={() => setIsCancelOpen(true)}
              onMessage={() => router.push("/admin/messages")}
            />
          ) : (
            <AdminEmptySelection title="Chưa chọn lịch hẹn" description="Chọn một lịch hẹn để xem đầy đủ thông tin." />
          )}
        </div>
      </div>

      {formMode ? (
        <AppointmentFormModal
          key={`${formMode}-${selectedAppointment?.id ?? "new"}-${selectedDate}`}
          appointment={formMode === "edit" ? selectedAppointment : null}
          appointments={appointments}
          defaultDate={selectedDate}
          onClose={() => setFormMode(null)}
          onSubmit={saveAppointment}
        />
      ) : null}
      {isCancelOpen && selectedAppointment ? (
        <CancelAppointmentDialog appointment={selectedAppointment} onClose={() => setIsCancelOpen(false)} onConfirm={confirmCancel} />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-appointments" } as const;
