"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import { useAdminAppointments, useAdminBranch, type AdminAppointment as ServerAppointment } from "@/service";
import {
  filterAppointments,
  getAppointmentsInRange,
  getAppointmentSummary,
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
  type AppointmentCustomer,
  type AppointmentDraft,
  type AppointmentService,
  type AppointmentStaff,
  type AppointmentStatus,
  type AppointmentStatusFilter,
  type AppointmentView,
} from "./data";
import {
  formatAppointmentDateLabel,
  getAppointmentViewRange,
  shiftAppointmentDate,
} from "./date-utils";

function toDatePart(iso: string): string {
  // en-CA gives ISO YYYY-MM-DD, which matches the fixture's date shape.
  try {
    return new Date(iso).toLocaleDateString("en-CA");
  } catch {
    return iso.slice(0, 10);
  }
}

function toTimePart(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return iso.slice(11, 16);
  }
}

function normalizeStatus(status: string): AppointmentStatus {
  const lower = status.toLowerCase();
  if (lower.includes("cancel")) return "cancelled";
  if (lower.includes("confirm") || lower.includes("complete") || lower.includes("service")) return "confirmed";
  return "pending";
}

function placeholderCustomer(customerId: string): AppointmentCustomer {
  const short = customerId.slice(0, 6);
  return {
    id: customerId,
    name: `Khách #${short}`,
    initials: short.slice(0, 2).toUpperCase(),
    phone: "",
    birthday: "",
    segment: "regular",
    preference: "",
    visits: 0,
    totalSpend: 0,
  };
}

function placeholderService(serviceIds: ReadonlyArray<string>): AppointmentService {
  const first = serviceIds[0] ?? "unknown";
  return {
    id: first,
    name: serviceIds.length > 1 ? `${serviceIds.length} dịch vụ` : `Dịch vụ #${first.slice(0, 6)}`,
    durationMinutes: 60,
  };
}

function placeholderStaff(staffId: string): AppointmentStaff {
  const short = staffId.slice(0, 6);
  return {
    id: staffId,
    name: `Nhân viên #${short}`,
    initials: short.slice(0, 2).toUpperCase(),
  };
}

/**
 * Server AdminAppointment carries ids + timestamps; the fixture Appointment
 * expects joined display shapes (customer / service / staff records) and
 * date / time split fields. Missing joins fall back to placeholders so the
 * calendar and list still render — the detail panel then shows the ids
 * until a follow-up wires customer / service / staff queries in parallel.
 */
function toFixtureAppointment(server: ServerAppointment): Appointment {
  return {
    id: server.id,
    date: toDatePart(server.startsAt),
    startTime: toTimePart(server.startsAt),
    endTime: toTimePart(server.endsAt),
    customer: placeholderCustomer(server.customerId),
    service: placeholderService(server.serviceIds),
    staff: placeholderStaff(server.staffId),
    status: normalizeStatus(server.status),
    note: server.note ?? "",
  };
}

export function AdminAppointmentsComponent({ initialCreate = false }: Readonly<{ initialCreate?: boolean }>) {
  const router = useRouter();
  const { branchId } = useAdminBranch();
  const { data, isLoading, error } = useAdminAppointments(branchId);
  // Server is the source of truth once it responds; fixture stays as the
  // fallback while there is no branch, the request is in flight, or errored.
  const source = useMemo<ReadonlyArray<Appointment>>(
    () => (data?.items ? data.items.map(toFixtureAppointment) : initialAppointments),
    [data],
  );
  // Session overlay: create/edit/cancel intents that this session made but
  // haven't yet been sent to the backend. A follow-up PR wires the
  // adminService round-trip and clears each overlay on the corresponding
  // successful response.
  const [localCreates, setLocalCreates] = useState<ReadonlyArray<Appointment>>([]);
  const [localEdits, setLocalEdits] = useState<Readonly<Record<string, AppointmentDraft>>>({});
  const [localCancels, setLocalCancels] = useState<ReadonlySet<string>>(() => new Set());
  const appointments = useMemo<ReadonlyArray<Appointment>>(() => {
    const merged = source
      .filter((a) => !localCancels.has(a.id))
      .map((a) => (localEdits[a.id] ? { ...a, ...localEdits[a.id] } : a));
    return [...merged, ...localCreates];
  }, [source, localCreates, localEdits, localCancels]);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_APPOINTMENT_DATE);
  const [view, setView] = useState<AppointmentView>("day");
  const [status, setStatus] = useState<AppointmentStatusFilter>("all");
  const [selectedId, setSelectedId] = useState(initialAppointments[0]?.id ?? "");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(() => initialCreate ? "create" : null);
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
    // Session-only. adminService.createAppointment / rescheduleAppointment
    // wiring lands in a follow-up PR once the form modal can produce real
    // customerId / staffId / serviceIds (currently it collects display
    // names, not ids).
    if (formMode === "edit" && selectedAppointment) {
      setLocalEdits((current) => ({ ...current, [selectedAppointment.id]: draft }));
    } else {
      const id = `appointment-local-${localId.current++}`;
      const appointment: Appointment = { ...draft, id };
      setLocalCreates((current) => [...current, appointment]);
      setSelectedId(id);
      setSelectedDate(draft.date);
    }
    setFormMode(null);
  }

  function confirmCancel() {
    if (!selectedAppointment) return;
    // Session-only. adminService.cancelAppointment wiring follows once the
    // cancel dialog can carry a reason to the server.
    setLocalCancels((current) => {
      const next = new Set(current);
      next.add(selectedAppointment.id);
      return next;
    });
    setIsCancelOpen(false);
  }

  return (
    <AdminPageLayout>
      {isLoading && !data ? (
        <p className="mb-2 text-xs text-admin-muted">Đang tải lịch hẹn từ chi nhánh…</p>
      ) : error && !data ? (
        <p className="mb-2 text-xs text-admin-danger">Không tải được — hiển thị dữ liệu mẫu.</p>
      ) : null}
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

      <div className="grid min-w-0 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)_19rem]">
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

        <aside className="lg:col-span-2 xl:col-span-1" aria-label="Chi tiết lịch hẹn đang chọn">
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
        </aside>
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
