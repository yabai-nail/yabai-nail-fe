import { describe, expect, it } from "vitest";

import { getApiOperation } from "../api";
import { bookingService } from "./service";

// Every booking gateway call names a real operation in the runtime catalog.
// `getApiOperation(id)` throws when the id is not registered, so a backend
// rename fails Vitest — not a runtime 404 in the booking flow.

const BOOKING_OPERATION_IDS = [
  "GET /api/v1/availability",
  "POST /api/v1/pricing/quotes",
  "POST /api/v1/appointments",
  "PUT /api/v1/appointments/{appointmentId}/benefit-intent",
  "POST /api/v1/appointments/{appointmentId}/confirmation",
  "POST /api/v1/appointments/{appointmentId}/confirmation-emails",
  "POST /api/v1/public/appointments/{opaqueAppointmentId}/confirmation",
  "GET /api/v1/me/appointments",
  "GET /api/v1/me/appointments/{appointmentId}",
  "POST /api/v1/me/appointments/{appointmentId}/cancellation",
  "GET /api/v1/me/appointments/{appointmentId}/cancellation-preview",
  "POST /api/v1/me/appointments/{appointmentId}/reschedule",
  "GET /api/v1/me/appointments/{appointmentId}/reschedule-options",
  "GET /api/v1/me/appointments/{appointmentId}/review-eligibility",
  "POST /api/v1/me/appointments/{appointmentId}/reviews",
] as const;

describe("bookingService", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of BOOKING_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each booking operation", () => {
    for (const fn of [
      bookingService.availability,
      bookingService.quote,
      bookingService.createAppointment,
      bookingService.setBenefitIntent,
      bookingService.confirmAppointment,
      bookingService.sendConfirmationEmail,
      bookingService.confirmPublicAppointment,
      bookingService.myAppointments,
      bookingService.myAppointment,
      bookingService.cancelMyAppointment,
      bookingService.myAppointmentCancellationPreview,
      bookingService.rescheduleMyAppointment,
      bookingService.myAppointmentRescheduleOptions,
      bookingService.myAppointmentReviewEligibility,
      bookingService.submitMyAppointmentReview,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});
