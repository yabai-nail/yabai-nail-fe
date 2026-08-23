import { executeApiOperation } from "../api";
import type { BackendList } from "../admin/types";
import type {
  Appointment,
  AppointmentBenefitIntent,
  AppointmentCancellationInput,
  AppointmentCancellationPreview,
  AppointmentConfirmationEmailInput,
  AppointmentConfirmationInput,
  AppointmentRescheduleInput,
  AppointmentRescheduleOptionsResponse,
  AppointmentReview,
  AppointmentReviewEligibility,
  AppointmentReviewInput,
  AvailabilityResponse,
  BookingQuote,
  BookingQuoteInput,
  CreateAppointmentInput,
} from "./types";

export const bookingService = {
  availability: (query: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<AvailabilityResponse>("GET /api/v1/availability", { query }),
  quote: (input: BookingQuoteInput, idempotencyKey?: string) =>
    executeApiOperation<BookingQuote>("POST /api/v1/pricing/quotes", {
      body: input,
      idempotencyKey,
    }),
  createAppointment: (input: CreateAppointmentInput, idempotencyKey?: string) =>
    executeApiOperation<Appointment>("POST /api/v1/appointments", {
      body: input,
      idempotencyKey,
    }),
  setBenefitIntent: (
    appointmentId: string,
    input: AppointmentBenefitIntent,
    version?: string | number,
  ) =>
    executeApiOperation<Appointment>(
      "PUT /api/v1/appointments/{appointmentId}/benefit-intent",
      { path: { appointmentId }, body: input, version },
    ),
  confirmAppointment: (
    appointmentId: string,
    input?: AppointmentConfirmationInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<Appointment>(
      "POST /api/v1/appointments/{appointmentId}/confirmation",
      { path: { appointmentId }, body: input ?? {}, idempotencyKey },
    ),
  sendConfirmationEmail: (
    appointmentId: string,
    input: AppointmentConfirmationEmailInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<{ delivered: boolean }>(
      "POST /api/v1/appointments/{appointmentId}/confirmation-emails",
      { path: { appointmentId }, body: input, idempotencyKey },
    ),
  confirmPublicAppointment: (
    opaqueAppointmentId: string,
    input?: AppointmentConfirmationInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<Appointment>(
      "POST /api/v1/public/appointments/{opaqueAppointmentId}/confirmation",
      { path: { opaqueAppointmentId }, body: input ?? {}, idempotencyKey },
    ),
  myAppointments: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<Appointment>>("GET /api/v1/me/appointments", { query }),
  myAppointment: (appointmentId: string) =>
    executeApiOperation<Appointment>("GET /api/v1/me/appointments/{appointmentId}", {
      path: { appointmentId },
    }),
  cancelMyAppointment: (
    appointmentId: string,
    input?: AppointmentCancellationInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<Appointment>(
      "POST /api/v1/me/appointments/{appointmentId}/cancellation",
      { path: { appointmentId }, body: input ?? {}, idempotencyKey },
    ),
  myAppointmentCancellationPreview: (appointmentId: string) =>
    executeApiOperation<AppointmentCancellationPreview>(
      "GET /api/v1/me/appointments/{appointmentId}/cancellation-preview",
      { path: { appointmentId } },
    ),
  rescheduleMyAppointment: (
    appointmentId: string,
    input: AppointmentRescheduleInput,
    version?: string | number,
  ) =>
    executeApiOperation<Appointment>(
      "POST /api/v1/me/appointments/{appointmentId}/reschedule",
      { path: { appointmentId }, body: input, version },
    ),
  myAppointmentRescheduleOptions: (appointmentId: string) =>
    executeApiOperation<AppointmentRescheduleOptionsResponse>(
      "GET /api/v1/me/appointments/{appointmentId}/reschedule-options",
      { path: { appointmentId } },
    ),
  myAppointmentReviewEligibility: (appointmentId: string) =>
    executeApiOperation<AppointmentReviewEligibility>(
      "GET /api/v1/me/appointments/{appointmentId}/review-eligibility",
      { path: { appointmentId } },
    ),
  submitMyAppointmentReview: (
    appointmentId: string,
    input: AppointmentReviewInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AppointmentReview>(
      "POST /api/v1/me/appointments/{appointmentId}/reviews",
      { path: { appointmentId }, body: input, idempotencyKey },
    ),
};
