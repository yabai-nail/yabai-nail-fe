"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  filterAppointments,
  getAppointmentsInRange,
  getAppointmentSummary,
} from "./appointment-state";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { AppointmentDetailPanel } from "./AppointmentDetailPanel";
import { AppointmentList } from "./AppointmentList";
import { AppointmentSummary } from "./AppointmentSummary";
import { AppointmentToolbar } from "./AppointmentToolbar";
import {
  DEFAULT_APPOINTMENT_DATE,
  initialAppointments,
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
  const [appointments] = useState(initialAppointments);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_APPOINTMENT_DATE);
  const [view, setView] = useState<AppointmentView>("day");
  const [status, setStatus] = useState<AppointmentStatusFilter>("all");
  const [selectedId, setSelectedId] = useState(initialAppointments[0]?.id ?? "");
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
        onCreate={() => undefined}
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
              onEdit={() => undefined}
              onCancel={() => undefined}
              onMessage={() => router.push("/admin/messages")}
            />
          ) : (
            <AdminEmptySelection title="Chưa chọn lịch hẹn" description="Chọn một lịch hẹn để xem đầy đủ thông tin." />
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-appointments" } as const;
