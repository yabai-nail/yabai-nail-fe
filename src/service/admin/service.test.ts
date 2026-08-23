import { describe, expect, it } from "vitest";

import { getApiOperation } from "../api";
import { adminService } from "./service";

// Sanity check: every admin appointment gateway call names a real operation in the
// runtime catalog. `getApiOperation(id)` throws when the id is not registered, so
// this test fails the whole suite the moment a service function drifts from a
// backend route rename or removal — much earlier than a runtime 404 in the UI.

const APPOINTMENT_OPERATION_IDS = [
  "GET /api/v1/admin/branches/{branchId}/appointments",
  "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}",
  "POST /api/v1/admin/branches/{branchId}/appointments",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/reschedule",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/cancellation",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/assignment",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/check-in",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/service-start",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/service-completion",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/no-show",
  "PUT /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/actual-services",
  "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/allocation-candidates",
  "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payments",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payments",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payment-quotes",
  "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/photos",
] as const;

const CUSTOMER_OPERATION_IDS = [
  "GET /api/v1/admin/branches/{branchId}/customers",
  "POST /api/v1/admin/branches/{branchId}/customers",
  "GET /api/v1/admin/branches/{branchId}/customers/{customerId}",
  "PATCH /api/v1/admin/branches/{branchId}/customers/{customerId}",
  "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/benefits",
  "POST /api/v1/admin/branches/{branchId}/customers/{customerId}/coupon-issuances",
  "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/nail-history",
  "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/notes",
  "POST /api/v1/admin/branches/{branchId}/customers/{customerId}/notes",
  "PATCH /api/v1/admin/branches/{branchId}/customers/{customerId}/notes/{noteId}",
  "POST /api/v1/admin/branches/{branchId}/customers/{customerId}/point-adjustments",
  "GET /api/v1/admin/branches/{branchId}/customers/lookup",
] as const;

describe("adminService appointment surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of APPOINTMENT_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each appointment operation", () => {
    for (const fn of [
      adminService.appointments,
      adminService.appointment,
      adminService.createAppointment,
      adminService.rescheduleAppointment,
      adminService.cancelAppointment,
      adminService.assignAppointment,
      adminService.checkInAppointment,
      adminService.startAppointmentService,
      adminService.completeAppointmentService,
      adminService.markAppointmentNoShow,
      adminService.setAppointmentActualServices,
      adminService.appointmentAllocationCandidates,
      adminService.appointmentPayments,
      adminService.recordAppointmentPayment,
      adminService.requestAppointmentPaymentQuote,
      adminService.attachAppointmentPhoto,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});

describe("adminService customer surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of CUSTOMER_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each customer operation", () => {
    for (const fn of [
      adminService.customers,
      adminService.customer,
      adminService.createCustomer,
      adminService.updateCustomer,
      adminService.customerBenefits,
      adminService.issueCustomerCoupon,
      adminService.customerNailHistory,
      adminService.customerNotes,
      adminService.createCustomerNote,
      adminService.updateCustomerNote,
      adminService.adjustCustomerPoints,
      adminService.lookupCustomer,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});
