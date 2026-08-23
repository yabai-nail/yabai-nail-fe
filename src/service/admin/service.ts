import { executeApiOperation } from "../api";
import type {
  AdminAppointment,
  AdminAppointmentActualServicesInput,
  AdminAppointmentAllocationCandidate,
  AdminAppointmentAssignmentInput,
  AdminAppointmentCancellationInput,
  AdminAppointmentDraft,
  AdminAppointmentPayment,
  AdminAppointmentPaymentInput,
  AdminAppointmentPaymentQuote,
  AdminAppointmentPhotoInput,
  AdminAppointmentRescheduleInput,
  AdminAppointmentServiceCompletionInput,
  AdminCalendarData,
  AdminCustomer,
  AdminDashboardData,
  AdminServiceCategory,
  AdminServiceItem,
  AdminStaffMember,
  BackendList,
  RevenueReport,
  StaffCompensation,
} from "./types";

export const adminService = {
  dashboard: (branchId: string, localDate?: string) =>
    executeApiOperation<AdminDashboardData>(
      "GET /api/v1/admin/branches/{branchId}/dashboard",
      { path: { branchId }, query: { localDate } },
    ),
  calendar: (branchId: string, from: string, to: string, view?: string) =>
    executeApiOperation<AdminCalendarData>(
      "GET /api/v1/admin/branches/{branchId}/calendar",
      { path: { branchId }, query: { from, to, view } },
    ),
  appointments: (branchId: string, query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminAppointment>>(
      "GET /api/v1/admin/branches/{branchId}/appointments",
      { path: { branchId }, query },
    ),
  appointment: (branchId: string, appointmentId: string) =>
    executeApiOperation<AdminAppointment>(
      "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}",
      { path: { branchId, appointmentId } },
    ),
  createAppointment: (branchId: string, draft: AdminAppointmentDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments",
      { path: { branchId }, body: draft, idempotencyKey },
    ),
  rescheduleAppointment: (
    branchId: string,
    appointmentId: string,
    input: AdminAppointmentRescheduleInput,
    version?: string | number,
  ) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/reschedule",
      { path: { branchId, appointmentId }, body: input, version },
    ),
  cancelAppointment: (
    branchId: string,
    appointmentId: string,
    input: AdminAppointmentCancellationInput,
    version?: string | number,
  ) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/cancellation",
      { path: { branchId, appointmentId }, body: input, version },
    ),
  assignAppointment: (
    branchId: string,
    appointmentId: string,
    input: AdminAppointmentAssignmentInput,
    version?: string | number,
  ) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/assignment",
      { path: { branchId, appointmentId }, body: input, version },
    ),
  checkInAppointment: (branchId: string, appointmentId: string, version?: string | number) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/check-in",
      { path: { branchId, appointmentId }, body: {}, version },
    ),
  startAppointmentService: (branchId: string, appointmentId: string, version?: string | number) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/service-start",
      { path: { branchId, appointmentId }, body: {}, version },
    ),
  completeAppointmentService: (
    branchId: string,
    appointmentId: string,
    input: AdminAppointmentServiceCompletionInput,
    version?: string | number,
  ) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/service-completion",
      { path: { branchId, appointmentId }, body: input, version },
    ),
  markAppointmentNoShow: (branchId: string, appointmentId: string, version?: string | number) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/no-show",
      { path: { branchId, appointmentId }, body: {}, version },
    ),
  setAppointmentActualServices: (
    branchId: string,
    appointmentId: string,
    input: AdminAppointmentActualServicesInput,
    version?: string | number,
  ) =>
    executeApiOperation<AdminAppointment>(
      "PUT /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/actual-services",
      { path: { branchId, appointmentId }, body: input, version },
    ),
  appointmentAllocationCandidates: (branchId: string, appointmentId: string) =>
    executeApiOperation<BackendList<AdminAppointmentAllocationCandidate>>(
      "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/allocation-candidates",
      { path: { branchId, appointmentId } },
    ),
  appointmentPayments: (branchId: string, appointmentId: string) =>
    executeApiOperation<BackendList<AdminAppointmentPayment>>(
      "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payments",
      { path: { branchId, appointmentId } },
    ),
  recordAppointmentPayment: (
    branchId: string,
    appointmentId: string,
    input: AdminAppointmentPaymentInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminAppointmentPayment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payments",
      { path: { branchId, appointmentId }, body: input, idempotencyKey },
    ),
  requestAppointmentPaymentQuote: (
    branchId: string,
    appointmentId: string,
    input?: Readonly<Record<string, unknown>>,
  ) =>
    executeApiOperation<AdminAppointmentPaymentQuote>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payment-quotes",
      { path: { branchId, appointmentId }, body: input ?? {} },
    ),
  attachAppointmentPhoto: (
    branchId: string,
    appointmentId: string,
    input: AdminAppointmentPhotoInput,
  ) =>
    executeApiOperation<AdminAppointment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/photos",
      { path: { branchId, appointmentId }, body: input },
    ),
  customers: (branchId: string, query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminCustomer>>(
      "GET /api/v1/admin/branches/{branchId}/customers",
      { path: { branchId }, query },
    ),
  services: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminServiceItem>>(
      "GET /api/v1/admin/services",
      { query },
    ),
  serviceCategories: () =>
    executeApiOperation<BackendList<AdminServiceCategory>>(
      "GET /api/v1/admin/service-categories",
    ),
  staff: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminStaffMember>>(
      "GET /api/v1/admin/staff",
      { query },
    ),
  staffMember: (staffId: string) =>
    executeApiOperation<AdminStaffMember>("GET /api/v1/admin/staff/{staffId}", {
      path: { staffId },
    }),
  staffCompensation: (staffId: string, period?: string) =>
    executeApiOperation<StaffCompensation>(
      "GET /api/v1/admin/staff/{staffId}/compensation",
      { path: { staffId }, query: { period } },
    ),
  revenueReport: (from?: string, to?: string) =>
    executeApiOperation<RevenueReport>(
      "GET /api/v1/admin/reports/revenue-summary",
      { query: { from, to } },
    ),
};
