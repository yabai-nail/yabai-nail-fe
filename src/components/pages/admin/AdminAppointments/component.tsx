"use client";

import type { Translator } from "@/i18n/config";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminAppointment,
  useAdminCalendar,
  useAdminBranch,
  useAdminCustomers,
  useAdminServices,
  useAdminStaff,
  type AdminAppointment as ServerAppointment,
  type AdminCustomer,
  type AdminServiceItem,
  type AdminStaffMember,
} from "@/service";
import {
  filterAppointments,
  getAppointmentsInRange,
  getAppointmentSummary,
} from "./appointment-state";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { AppointmentDetailPanel } from "./AppointmentDetailPanel";
import { AssignStaffModal } from "./AssignStaffModal";
import { ActualServicesModal } from "./ActualServicesModal";
import { AttachPhotoModal } from "./AttachPhotoModal";
import { todayAtSalon, zonedIso } from "@/lib/salon-date";
import { AppointmentFormModal } from "./AppointmentFormModal";
import { AppointmentList } from "./AppointmentList";
import { AppointmentSummary } from "./AppointmentSummary";
import { AppointmentToolbar } from "./AppointmentToolbar";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";
import {
  type Appointment,
  type AppointmentCustomer,
  type AppointmentDraft,
  type AppointmentLifecycleAction,
  type AppointmentService,
  type AppointmentStaff,
  type AppointmentStatusFilter,
  type AppointmentView,
} from "./data";
import {
  formatAppointmentDateLabel,
  getAppointmentViewRange,
  shiftAppointmentDate,
} from "./date-utils";
import { normalizeAppointmentStatus } from "./status";

const lifecycleSuccessMessages: Record<AppointmentLifecycleAction, string> = {
  "check-in": "Đã check-in lịch hẹn",
  "service-start": "Đã bắt đầu dịch vụ",
  "service-complete": "Đã hoàn tất dịch vụ",
  "no-show": "Đã đánh dấu khách không đến",
};

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



function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function resolveCustomer(customerId: string, byId: Map<string, AdminCustomer>, t: Translator): AppointmentCustomer {
  const server = byId.get(customerId);
  const name = server?.displayName ?? server?.name ?? t("fallback.customer");
  const record = server as unknown as Record<string, unknown> | undefined;
  return {
    id: customerId,
    name,
    initials: deriveInitials(name),
    phone: server?.phone ?? "",
    birthday: (record?.birthday as string) ?? "",
    segment: "regular",
    preference: (record?.preference as string) ?? "",
    visits: (record?.visits as number) ?? 0,
    totalSpend: (record?.totalSpend as number) ?? 0,
  };
}

function resolveService(
  serviceIds: ReadonlyArray<string>,
  byId: Map<string, AdminServiceItem>,
  t: Translator,
): AppointmentService {
  const first = serviceIds[0] ?? "unknown";
  const server = byId.get(first);
  if (serviceIds.length > 1) {
    return {
      id: first,
      name: t("fallback.multiService", { count: serviceIds.length }),
      durationMinutes: server?.durationMinutes ?? 60,
    };
  }
  return {
    id: first,
    name: server?.name ?? t("fallback.service"),
    durationMinutes: server?.durationMinutes ?? 60,
  };
}

function resolveStaff(staffId: string, byId: Map<string, AdminStaffMember>, t: Translator): AppointmentStaff {
  const server = byId.get(staffId);
  const name = server?.displayName ?? t("fallback.staff");
  return { id: staffId, name, initials: deriveInitials(name) };
}

/**
 * Server AdminAppointment carries ids + timestamps; the fixture Appointment
 * expects joined display shapes (customer / service / staff records) and
 * date / time split fields. Names come from parallel `useAdminCustomers` /
 * `useAdminStaff` / `useAdminServices` queries; unresolved ids use semantic
 * placeholders so a partial load never exposes database identifiers.
 */
function toFixtureAppointment(
  server: ServerAppointment,
  lookups: {
    readonly customers: Map<string, AdminCustomer>;
    readonly staff: Map<string, AdminStaffMember>;
    readonly services: Map<string, AdminServiceItem>;
  },
  t: Translator,
): Appointment {
  return {
    id: server.id,
    date: toDatePart(server.startsAt),
    startTime: toTimePart(server.startsAt),
    endTime: toTimePart(server.endsAt),
    customer: resolveCustomer(server.customerId, lookups.customers, t),
    service: resolveService(server.serviceIds, lookups.services, t),
    staff: resolveStaff(server.staffId, lookups.staff, t),
    status: normalizeAppointmentStatus(server.status),
    note: server.note ?? "",
    serverStatus: server.status,
    version: server.version,
  };
}

// Which BE status → which set of lifecycle transitions are enabled. Anything
// not listed = terminal (no action bar).
const LIFECYCLE_BY_STATUS: Record<string, ReadonlyArray<AppointmentLifecycleAction>> = {
  CONFIRMED: ["check-in", "no-show"],
  CHECKED_IN: ["service-start", "no-show"],
  IN_SERVICE: ["service-complete"],
};

export function AdminAppointmentsComponent({
  initialCreate = false,
  initialSelectedId,
}: Readonly<{
  initialCreate?: boolean;
  /** Deep-link target from dashboard drill-down; overrides the first-row default. */
  initialSelectedId?: string;
}>) {
  const t = useTranslations("admin.appointments");
  const router = useRouter();
  const { branchId } = useAdminBranch();
  const [selectedDate, setSelectedDate] = useState(todayAtSalon);
  const [view, setView] = useState<AppointmentView>("day");
  const viewRange = useMemo(
    () => getAppointmentViewRange(selectedDate, view),
    [selectedDate, view],
  );
  const calendarTo = shiftAppointmentDate(viewRange.end, "day", 1);
  const { data, isLoading, error, mutate: mutateAppointments } = useAdminCalendar(
    branchId,
    zonedIso(viewRange.start, "00:00"),
    zonedIso(calendarTo, "00:00"),
    view,
  );
  const deepLinkAppointment = useAdminAppointment(branchId, initialSelectedId ?? null);
  // Parallel joins: appointment rows arrive with ids; the name-resolvers
  // hand back their own lookup, and the adapter fills the joined record so
  // the detail panel reads real names instead of "Khách #xxxxx".
  const { data: customersData } = useAdminCustomers(branchId);
  const { data: staffData } = useAdminStaff();
  const { data: servicesData } = useAdminServices();
  const lookups = useMemo(() => ({
    customers: new Map((customersData?.items ?? []).map((c) => [c.id, c] as const)),
    staff: new Map((staffData?.items ?? []).map((s) => [s.id, s] as const)),
    services: new Map((servicesData?.items ?? []).map((s) => [s.id, s] as const)),
  }), [customersData, staffData, servicesData]);
  // What the create/edit form may pick from: the branch's real customers,
  // services and staff, adapted into the display shapes the form expects.
  const formOptions = useMemo(() => ({
    customers: (customersData?.items ?? []).map((c) => resolveCustomer(c.id, lookups.customers, t)),
    services: (servicesData?.items ?? []).map((s) => resolveService([s.id], lookups.services, t)),
    staff: (staffData?.items ?? []).map((s) => resolveStaff(s.id, lookups.staff, t)),
  }), [customersData, servicesData, staffData, lookups, t]);
  const source = useMemo<ReadonlyArray<Appointment>>(
    () => (data?.appointments ?? []).map((row) => toFixtureAppointment(row, lookups, t)),
    [data, lookups, t],
  );
  const appointments = source;
  // The calendar opens on the salon's today. It used to open on
  // DEFAULT_APPOINTMENT_DATE — the date the demo fixtures were written for —
  // so the screen asked the API for 16/08/2026 and looked empty forever.
  const [status, setStatus] = useState<AppointmentStatusFilter>("all");
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? "");
  // Deep-link: when the drill-down targets an appointment, jump the calendar
  // to its day so the detail panel resolves once the row loads. React 19
  // adjust-state-on-input pattern instead of useEffect + setState.
  const [drilldownConsumed, setDrilldownConsumed] = useState(false);
  if (initialSelectedId && !drilldownConsumed) {
    const target =
      (data?.appointments ?? []).find((row) => row.id === initialSelectedId) ??
      deepLinkAppointment.data;
    if (target) {
      setDrilldownConsumed(true);
      setSelectedDate(toDatePart(target.startsAt));
    }
  }
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(() => initialCreate ? "create" : null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const visibleDayAppointments = useMemo(
    () => filterAppointments(appointments, { date: selectedDate, status }),
    [appointments, selectedDate, status],
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

  // The form gives local date + time strings; attach the branch's real UTC
  // offset so the backend stores the wall-clock moment the admin selected.
  // This used to hardcode +09:00 (Asia/Tokyo) while the live branch runs
  // Asia/Ho_Chi_Minh, which shifted every saved appointment two hours early.
  const toIso = (date: string, time: string): string => zonedIso(date, time);

  async function saveAppointment(draft: AppointmentDraft) {
    if (!branchId) throw new Error(t("error.branchRequired"));
    if (formMode === "edit" && selectedAppointment?.version !== undefined) {
      await adminService.rescheduleAppointment(
        branchId,
        selectedAppointment.id,
        {
          startsAt: toIso(draft.date, draft.startTime),
          staffId: draft.staff.id,
        },
        selectedAppointment.version,
      );
      setSelectedDate(draft.date);
    } else if (formMode === "create") {
      const created = await adminService.createAppointment(branchId, {
        customerId: draft.customer.id,
        staffId: draft.staff.id,
        serviceIds: [draft.service.id],
        startsAt: toIso(draft.date, draft.startTime),
        note: draft.note,
      });
      setSelectedId(created.id);
      setSelectedDate(draft.date);
    } else {
      throw new Error(t("error.notLoaded"));
    }
    notifySuccess(formMode === "edit" ? "Đã cập nhật lịch hẹn" : "Đã tạo lịch hẹn");
    await mutateAppointments();
    setFormMode(null);
  }

  // Server-side lifecycle transitions the detail panel exposes. Each call
  // maps directly onto one canonical admin operation; success revalidates
  // the appointment list so the row's `serverStatus` (and any BE-computed
  // fields) refreshes.
  const [lifecyclePending, setLifecyclePending] = useState<AppointmentLifecycleAction | null>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  async function runLifecycle(
    action: AppointmentLifecycleAction,
    appointmentId: string,
    version: number | undefined,
  ) {
    if (!branchId) return;
    setLifecyclePending(action);
    setLifecycleError(null);
    try {
      if (action === "check-in") {
        await adminService.checkInAppointment(branchId, appointmentId, version);
      } else if (action === "service-start") {
        await adminService.startAppointmentService(branchId, appointmentId, version);
      } else if (action === "service-complete") {
        await adminService.completeAppointmentService(branchId, appointmentId, {}, version);
      } else {
        await adminService.markAppointmentNoShow(branchId, appointmentId, version);
      }
      notifySuccess(lifecycleSuccessMessages[action]);
      void mutateAppointments();
    } catch (thrown) {
      setLifecycleError(
        thrown instanceof Error ? thrown.message : t("error.lifecycle"),
      );
    } finally {
      setLifecyclePending(null);
    }
  }

  // Assignment modal state. Only opens for server-backed rows because the
  // allocation-candidates endpoint is keyed on a persisted appointment id.
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  async function confirmAssign(staffId: string, note: string) {
    if (!branchId || !selectedAppointment) return;
    setAssignSubmitting(true);
    setAssignError(null);
    try {
      await adminService.assignAppointment(
        branchId,
        selectedAppointment.id,
        note ? { staffId, note } : { staffId },
        selectedAppointment.version,
      );
      notifySuccess("Đã phân công nhân viên");
      setIsAssignOpen(false);
      void mutateAppointments();
    } catch (thrown) {
      setAssignError(
        thrown instanceof Error ? thrown.message : t("error.assign"),
      );
    } finally {
      setAssignSubmitting(false);
    }
  }

  // Actual-services modal state. Uses the appointment.version for If-Match
  // so a concurrent lifecycle transition doesn't silently overwrite the
  // planner's edit.
  const [isActualOpen, setIsActualOpen] = useState(false);
  const [actualSubmitting, setActualSubmitting] = useState(false);
  const [actualError, setActualError] = useState<string | null>(null);
  async function confirmActualServices(serviceIds: ReadonlyArray<string>) {
    if (!branchId || !selectedAppointment) return;
    setActualSubmitting(true);
    setActualError(null);
    try {
      await adminService.setAppointmentActualServices(
        branchId,
        selectedAppointment.id,
        { serviceIds: [...serviceIds] },
        selectedAppointment.version,
      );
      notifySuccess("Đã cập nhật dịch vụ thực tế");
      setIsActualOpen(false);
      void mutateAppointments();
    } catch (thrown) {
      setActualError(
        thrown instanceof Error ? thrown.message : t("error.actualServices"),
      );
    } finally {
      setActualSubmitting(false);
    }
  }

  // Attach-photo modal state. Version is not sent on POST photos; the
  // endpoint appends, not updates.
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  async function confirmAttachPhoto(input: { mediaId: string; kind?: string; note?: string }) {
    if (!branchId || !selectedAppointment) return;
    setPhotoSubmitting(true);
    setPhotoError(null);
    try {
      await adminService.attachAppointmentPhoto(branchId, selectedAppointment.id, input);
      notifySuccess("Đã đính kèm ảnh vào lịch hẹn");
      setIsPhotoOpen(false);
      void mutateAppointments();
    } catch (thrown) {
      setPhotoError(
        thrown instanceof Error ? thrown.message : t("error.photo"),
      );
    } finally {
      setPhotoSubmitting(false);
    }
  }

  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  async function confirmCancel() {
    if (!branchId || !selectedAppointment || selectedAppointment.version === undefined) return;
    setCancelPending(true);
    setCancelError(null);
    try {
      await adminService.cancelAppointment(
        branchId,
        selectedAppointment.id,
        { reasonCode: "ADMIN_CALENDAR_CANCEL" },
        selectedAppointment.version,
      );
      notifySuccess("Đã hủy lịch hẹn");
      await mutateAppointments();
      setIsCancelOpen(false);
    } catch (thrown) {
      setCancelError(thrown instanceof Error ? thrown.message : t("error.cancel"));
    } finally {
      setCancelPending(false);
    }
  }

  return (
    <AdminPageLayout>
      {isLoading && !data ? (
        <p className="mb-2 text-xs text-admin-muted">{t("loading")}</p>
      ) : error && !data ? (
        <p className="mb-2 text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : null}
      <AppointmentToolbar
        dateLabel={formatAppointmentDateLabel(selectedDate, view, t)}
        view={view}
        status={status}
        onPrevious={() => moveDate(-1)}
        onNext={() => moveDate(1)}
        onToday={() => setSelectedDate(todayAtSalon())}
        onViewChange={setView}
        onStatusChange={setStatus}
        onCreate={() => setFormMode("create")}
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)_19rem]">
        <section className="min-w-0" aria-label={t("regionList")}>
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

        <aside className="lg:col-span-2 xl:col-span-1" aria-label={t("regionDetail")}>
          {selectedAppointment ? (
            <AppointmentDetailPanel
              appointment={selectedAppointment}
              lifecycleActions={
                selectedAppointment.serverStatus
                  ? LIFECYCLE_BY_STATUS[selectedAppointment.serverStatus] ?? []
                  : []
              }
              lifecyclePending={lifecyclePending}
              lifecycleError={lifecycleError}
              onLifecycle={(action) =>
                runLifecycle(action, selectedAppointment.id, selectedAppointment.version)
              }
              onEdit={() => setFormMode("edit")}
              onCancel={() => { setCancelError(null); setIsCancelOpen(true); }}
              onMessage={() => router.push("/admin/messages")}
              onAssignStaff={
                selectedAppointment.version !== undefined
                  ? () => {
                      setAssignError(null);
                      setIsAssignOpen(true);
                    }
                  : undefined
              }
              onEditActualServices={
                selectedAppointment.version !== undefined
                  ? () => {
                      setActualError(null);
                      setIsActualOpen(true);
                    }
                  : undefined
              }
              onAttachPhoto={
                selectedAppointment.version !== undefined
                  ? () => {
                      setPhotoError(null);
                      setIsPhotoOpen(true);
                    }
                  : undefined
              }
            />
          ) : (
            <AdminEmptySelection title={t("emptyTitle")} description={t("emptyDescription")} />
          )}
        </aside>
      </div>

      {formMode ? (
        <AppointmentFormModal
          key={`${formMode}-${selectedAppointment?.id ?? "new"}-${selectedDate}`}
          appointment={formMode === "edit" ? selectedAppointment : null}
          appointments={appointments}
          defaultDate={selectedDate}
          options={formOptions}
          onClose={() => setFormMode(null)}
          onSubmit={saveAppointment}
        />
      ) : null}
      {isCancelOpen && selectedAppointment ? (
        <CancelAppointmentDialog appointment={selectedAppointment} onClose={() => setIsCancelOpen(false)} onConfirm={confirmCancel} pending={cancelPending} error={cancelError} />
      ) : null}
      {isAssignOpen && selectedAppointment ? (
        <AssignStaffModal
          branchId={branchId}
          appointment={selectedAppointment}
          onClose={() => setIsAssignOpen(false)}
          onConfirm={confirmAssign}
          submitting={assignSubmitting}
          error={assignError}
        />
      ) : null}
      {isActualOpen && selectedAppointment ? (
        <ActualServicesModal
          appointment={selectedAppointment}
          onClose={() => setIsActualOpen(false)}
          onConfirm={confirmActualServices}
          submitting={actualSubmitting}
          error={actualError}
        />
      ) : null}
      {isPhotoOpen && selectedAppointment ? (
        <AttachPhotoModal
          appointment={selectedAppointment}
          onClose={() => setIsPhotoOpen(false)}
          onConfirm={confirmAttachPhoto}
          submitting={photoSubmitting}
          error={photoError}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-appointments" } as const;
