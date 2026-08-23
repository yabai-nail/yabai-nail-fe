"use client";

import { useApiOperation } from "../api";
import type { BackendList } from "../admin/types";
import type {
  Appointment,
  AppointmentCancellationPreview,
  AppointmentRescheduleOptionsResponse,
  AppointmentReviewEligibility,
  AvailabilityResponse,
} from "./types";

// Only GET-shaped ops expose SWR hooks. Mutations (create, cancel, reschedule,
// review submit, confirmation) are called imperatively from callbacks so the
// caller controls its own optimistic update and `mutate()` invalidation.

export function useAvailability(
  query: Readonly<Record<string, string | number | undefined>> | null,
) {
  return useApiOperation<AvailabilityResponse>(query ? "GET /api/v1/availability" : null, {
    query: query ?? undefined,
  });
}

export function useMyAppointments(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<Appointment>>("GET /api/v1/me/appointments", { query });
}

export function useMyAppointment(appointmentId: string | null) {
  return useApiOperation<Appointment>(
    appointmentId ? "GET /api/v1/me/appointments/{appointmentId}" : null,
    { path: appointmentId ? { appointmentId } : undefined },
  );
}

export function useMyAppointmentCancellationPreview(appointmentId: string | null) {
  return useApiOperation<AppointmentCancellationPreview>(
    appointmentId ? "GET /api/v1/me/appointments/{appointmentId}/cancellation-preview" : null,
    { path: appointmentId ? { appointmentId } : undefined },
  );
}

export function useMyAppointmentRescheduleOptions(appointmentId: string | null) {
  return useApiOperation<AppointmentRescheduleOptionsResponse>(
    appointmentId ? "GET /api/v1/me/appointments/{appointmentId}/reschedule-options" : null,
    { path: appointmentId ? { appointmentId } : undefined },
  );
}

export function useMyAppointmentReviewEligibility(appointmentId: string | null) {
  return useApiOperation<AppointmentReviewEligibility>(
    appointmentId ? "GET /api/v1/me/appointments/{appointmentId}/review-eligibility" : null,
    { path: appointmentId ? { appointmentId } : undefined },
  );
}
