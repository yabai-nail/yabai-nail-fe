import type { Translator } from "@/i18n/config";
import type {
  Appointment,
  AppointmentDraft,
  AppointmentStatusFilter,
} from "./data";

export type AppointmentDraftErrors = Partial<
  Record<"date" | "startTime" | "endTime" | "customer" | "service" | "staff", string>
>;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export function filterAppointments(
  appointments: ReadonlyArray<Appointment>,
  filter: { readonly date: string; readonly status: AppointmentStatusFilter },
) {
  return appointments
    .filter(
      (appointment) =>
        appointment.date === filter.date &&
        (filter.status === "all" || appointment.status === filter.status),
    )
    .toSorted((left, right) => left.startTime.localeCompare(right.startTime));
}

export function getAppointmentsInRange(
  appointments: ReadonlyArray<Appointment>,
  startDate: string,
  endDate: string,
) {
  return appointments
    .filter(
      (appointment) => appointment.date >= startDate && appointment.date <= endDate,
    )
    .toSorted(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.startTime.localeCompare(right.startTime),
    );
}

export function getAppointmentSummary(appointments: ReadonlyArray<Appointment>) {
  return appointments.reduce(
    (summary, appointment) => ({
      ...summary,
      total: summary.total + 1,
      [appointment.status]: summary[appointment.status] + 1,
    }),
    // Every status is seeded: an unseeded key made summary[status] undefined and
    // the tile rendered NaN the moment the API returned a state the old three-way
    // union did not cover.
    {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      checked_in: 0,
      in_service: 0,
      awaiting_payment: 0,
      completed: 0,
      no_show: 0,
    },
  );
}

export function validateAppointmentDraft(draft: AppointmentDraft, t: Translator) {
  const errors: AppointmentDraftErrors = {};

  if (!draft.date) errors.date = t("validation.date");
  if (!draft.startTime) errors.startTime = t("validation.startTime");
  if (!draft.endTime) errors.endTime = t("validation.endTime");
  if (!draft.customer.id) errors.customer = t("validation.customer");
  if (!draft.service.id) errors.service = t("validation.service");
  if (!draft.staff.id) errors.staff = t("validation.staff");

  if (
    draft.startTime &&
    draft.endTime &&
    timeToMinutes(draft.endTime) <= timeToMinutes(draft.startTime)
  ) {
    errors.endTime = t("validation.endAfterStart");
  }

  return errors;
}

export function hasAppointmentConflict(
  appointments: ReadonlyArray<Appointment>,
  draft: AppointmentDraft,
  excludeId?: string,
) {
  const draftStart = timeToMinutes(draft.startTime);
  const draftEnd = timeToMinutes(draft.endTime);

  return appointments.some((appointment) => {
    if (
      appointment.id === excludeId ||
      appointment.status === "cancelled" ||
      appointment.date !== draft.date ||
      appointment.staff.id !== draft.staff.id
    ) {
      return false;
    }

    const appointmentStart = timeToMinutes(appointment.startTime);
    const appointmentEnd = timeToMinutes(appointment.endTime);
    return draftStart < appointmentEnd && draftEnd > appointmentStart;
  });
}

export function createAppointment(
  appointments: ReadonlyArray<Appointment>,
  draft: AppointmentDraft,
  id: string,
) {
  return [...appointments, { id, ...draft }];
}

export function updateAppointment(
  appointments: ReadonlyArray<Appointment>,
  id: string,
  draft: AppointmentDraft,
) {
  return appointments.map((appointment) =>
    appointment.id === id ? { id, ...draft } : appointment,
  );
}

export function cancelAppointment(
  appointments: ReadonlyArray<Appointment>,
  id: string,
) {
  return appointments.map((appointment) =>
    appointment.id === id ? { ...appointment, status: "cancelled" as const } : appointment,
  );
}
