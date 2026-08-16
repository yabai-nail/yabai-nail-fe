"use client";

import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  filterAppointments,
  getAppointmentSummary,
} from "./appointment-state";
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
  shiftAppointmentDate,
} from "./date-utils";

export function AdminAppointmentsComponent() {
  const [appointments] = useState(initialAppointments);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_APPOINTMENT_DATE);
  const [view, setView] = useState<AppointmentView>("day");
  const [status, setStatus] = useState<AppointmentStatusFilter>("all");
  const [selectedId, setSelectedId] = useState(initialAppointments[0]?.id ?? "");
  const visibleDayAppointments = useMemo(
    () => filterAppointments(appointments, { date: selectedDate, status }),
    [appointments, selectedDate, status],
  );
  const selectedAppointment = resolveVisibleSelection(visibleDayAppointments, selectedId);
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

        <Card className="min-h-[32rem] rounded-lg border-admin-border bg-admin-surface shadow-none">
          <Card.Content className="grid place-items-center p-6">
            <div className="text-center">
              <CalendarDaysIcon className="mx-auto size-10 text-admin-accent" />
              <h2 className="mt-3 font-bold text-admin-ink">Lịch {view === "day" ? "ngày" : view === "week" ? "tuần" : "tháng"}</h2>
              <p className="mt-1 text-sm text-admin-muted">Khung lịch đang được hoàn thiện ở lát cắt tiếp theo.</p>
            </div>
          </Card.Content>
        </Card>

        <div className="2xl:block">
          <AdminEmptySelection
            title={selectedAppointment ? selectedAppointment.customer.name : "Chưa chọn lịch hẹn"}
            description={selectedAppointment ? `${selectedAppointment.startTime} - ${selectedAppointment.endTime} · ${selectedAppointment.service.name}` : "Chọn một lịch hẹn để xem đầy đủ thông tin."}
          />
        </div>
      </div>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-appointments" } as const;
