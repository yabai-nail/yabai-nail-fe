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
  AdminCustomerBenefits,
  AdminCustomerCouponIssuance,
  AdminCustomerCouponIssuanceInput,
  AdminCustomerDraft,
  AdminCustomerLookupResult,
  AdminCustomerNailHistoryEntry,
  AdminCustomerNote,
  AdminCustomerNoteDraft,
  AdminCustomerNotePatch,
  AdminCustomerPatch,
  AdminCustomerPointAdjustment,
  AdminCustomerPointAdjustmentInput,
  AdminDashboardData,
  AdminLeaveRequest,
  AdminLeaveRequestDecisionInput,
  AdminLeaveRequestDraft,
  AdminServiceCategory,
  AdminServiceCategoryDraft,
  AdminServiceCategoryPatch,
  AdminServiceCategoryReorderInput,
  AdminServiceItem,
  AdminServiceItemDraft,
  AdminServiceItemPatch,
  AdminSurcharge,
  AdminSurchargeDraft,
  AdminSurchargePatch,
  AdminStaffCompensationInput,
  AdminStaffDraft,
  AdminStaffMember,
  AdminStaffPatch,
  AdminStaffPerformance,
  AdminStaffShift,
  AdminStaffShiftDraft,
  AdminStaffSkill,
  AdminStaffSkillsInput,
  AdminAuditLog,
  AdminPaymentRefund,
  AdminPaymentRefundInput,
  AdminReport,
  AdminReportExport,
  AdminReportExportDownloadInput,
  AdminReportExportDownloadUrl,
  AdminReportExportInput,
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
  customer: (branchId: string, customerId: string) =>
    executeApiOperation<AdminCustomer>(
      "GET /api/v1/admin/branches/{branchId}/customers/{customerId}",
      { path: { branchId, customerId } },
    ),
  createCustomer: (branchId: string, draft: AdminCustomerDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminCustomer>(
      "POST /api/v1/admin/branches/{branchId}/customers",
      { path: { branchId }, body: draft, idempotencyKey },
    ),
  updateCustomer: (
    branchId: string,
    customerId: string,
    patch: AdminCustomerPatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminCustomer>(
      "PATCH /api/v1/admin/branches/{branchId}/customers/{customerId}",
      { path: { branchId, customerId }, body: patch, version },
    ),
  customerBenefits: (branchId: string, customerId: string) =>
    executeApiOperation<AdminCustomerBenefits>(
      "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/benefits",
      { path: { branchId, customerId } },
    ),
  issueCustomerCoupon: (
    branchId: string,
    customerId: string,
    input: AdminCustomerCouponIssuanceInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminCustomerCouponIssuance>(
      "POST /api/v1/admin/branches/{branchId}/customers/{customerId}/coupon-issuances",
      { path: { branchId, customerId }, body: input, idempotencyKey },
    ),
  customerNailHistory: (
    branchId: string,
    customerId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<BackendList<AdminCustomerNailHistoryEntry>>(
      "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/nail-history",
      { path: { branchId, customerId }, query },
    ),
  customerNotes: (
    branchId: string,
    customerId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<BackendList<AdminCustomerNote>>(
      "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/notes",
      { path: { branchId, customerId }, query },
    ),
  createCustomerNote: (
    branchId: string,
    customerId: string,
    draft: AdminCustomerNoteDraft,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminCustomerNote>(
      "POST /api/v1/admin/branches/{branchId}/customers/{customerId}/notes",
      { path: { branchId, customerId }, body: draft, idempotencyKey },
    ),
  updateCustomerNote: (
    branchId: string,
    customerId: string,
    noteId: string,
    patch: AdminCustomerNotePatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminCustomerNote>(
      "PATCH /api/v1/admin/branches/{branchId}/customers/{customerId}/notes/{noteId}",
      { path: { branchId, customerId, noteId }, body: patch, version },
    ),
  adjustCustomerPoints: (
    branchId: string,
    customerId: string,
    input: AdminCustomerPointAdjustmentInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminCustomerPointAdjustment>(
      "POST /api/v1/admin/branches/{branchId}/customers/{customerId}/point-adjustments",
      { path: { branchId, customerId }, body: input, idempotencyKey },
    ),
  lookupCustomer: (branchId: string, query: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<AdminCustomerLookupResult>(
      "GET /api/v1/admin/branches/{branchId}/customers/lookup",
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
  createService: (draft: AdminServiceItemDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminServiceItem>("POST /api/v1/admin/services", {
      body: draft,
      idempotencyKey,
    }),
  updateService: (serviceId: string, patch: AdminServiceItemPatch, version?: string | number) =>
    executeApiOperation<AdminServiceItem>("PATCH /api/v1/admin/services/{serviceId}", {
      path: { serviceId },
      body: patch,
      version,
    }),
  createServiceCategory: (draft: AdminServiceCategoryDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminServiceCategory>("POST /api/v1/admin/service-categories", {
      body: draft,
      idempotencyKey,
    }),
  updateServiceCategory: (
    categoryId: string,
    patch: AdminServiceCategoryPatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminServiceCategory>(
      "PATCH /api/v1/admin/service-categories/{categoryId}",
      { path: { categoryId }, body: patch, version },
    ),
  reorderServiceCategories: (
    input: AdminServiceCategoryReorderInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<BackendList<AdminServiceCategory>>(
      "POST /api/v1/admin/service-categories/reorder",
      { body: input, idempotencyKey },
    ),
  surcharges: () =>
    executeApiOperation<BackendList<AdminSurcharge>>("GET /api/v1/admin/surcharges"),
  createSurcharge: (draft: AdminSurchargeDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminSurcharge>("POST /api/v1/admin/surcharges", {
      body: draft,
      idempotencyKey,
    }),
  updateSurcharge: (
    surchargeId: string,
    patch: AdminSurchargePatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminSurcharge>("PATCH /api/v1/admin/surcharges/{surchargeId}", {
      path: { surchargeId },
      body: patch,
      version,
    }),
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
  createStaff: (draft: AdminStaffDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminStaffMember>("POST /api/v1/admin/staff", {
      body: draft,
      idempotencyKey,
    }),
  updateStaff: (staffId: string, patch: AdminStaffPatch, version?: string | number) =>
    executeApiOperation<AdminStaffMember>("PATCH /api/v1/admin/staff/{staffId}", {
      path: { staffId },
      body: patch,
      version,
    }),
  setStaffCompensation: (
    staffId: string,
    input: AdminStaffCompensationInput,
    version?: string | number,
  ) =>
    executeApiOperation<StaffCompensation>("PUT /api/v1/admin/staff/{staffId}/compensation", {
      path: { staffId },
      body: input,
      version,
    }),
  staffSkills: (staffId: string) =>
    executeApiOperation<BackendList<AdminStaffSkill>>(
      "GET /api/v1/admin/staff/{staffId}/skills",
      { path: { staffId } },
    ),
  setStaffSkills: (staffId: string, input: AdminStaffSkillsInput, version?: string | number) =>
    executeApiOperation<BackendList<AdminStaffSkill>>(
      "PUT /api/v1/admin/staff/{staffId}/skills",
      { path: { staffId }, body: input, version },
    ),
  staffShifts: (
    branchId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<BackendList<AdminStaffShift>>(
      "GET /api/v1/admin/branches/{branchId}/shifts",
      { path: { branchId }, query },
    ),
  createStaffShift: (branchId: string, draft: AdminStaffShiftDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminStaffShift>(
      "POST /api/v1/admin/branches/{branchId}/shifts",
      { path: { branchId }, body: draft, idempotencyKey },
    ),
  createLeaveRequest: (
    branchId: string,
    draft: AdminLeaveRequestDraft,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminLeaveRequest>(
      "POST /api/v1/admin/branches/{branchId}/leave-requests",
      { path: { branchId }, body: draft, idempotencyKey },
    ),
  decideLeaveRequest: (
    branchId: string,
    requestId: string,
    input: AdminLeaveRequestDecisionInput,
    version?: string | number,
  ) =>
    executeApiOperation<AdminLeaveRequest>(
      "POST /api/v1/admin/branches/{branchId}/leave-requests/{requestId}/decision",
      { path: { branchId, requestId }, body: input, version },
    ),
  staffPerformance: (
    branchId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<AdminStaffPerformance>(
      "GET /api/v1/admin/branches/{branchId}/staff-performance",
      { path: { branchId }, query },
    ),
  revenueReport: (from?: string, to?: string) =>
    executeApiOperation<RevenueReport>(
      "GET /api/v1/admin/reports/revenue-summary",
      { query: { from, to } },
    ),
  branchesReport: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<AdminReport>("GET /api/v1/admin/reports/branches", { query }),
  customersReport: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<AdminReport>("GET /api/v1/admin/reports/customers", { query }),
  staffPerformanceReport: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<AdminReport>("GET /api/v1/admin/reports/staff-performance", { query }),
  createReportExport: (input: AdminReportExportInput, idempotencyKey?: string) =>
    executeApiOperation<AdminReportExport>("POST /api/v1/admin/report-exports", {
      body: input,
      idempotencyKey,
    }),
  reportExport: (exportId: string) =>
    executeApiOperation<AdminReportExport>("GET /api/v1/admin/report-exports/{exportId}", {
      path: { exportId },
    }),
  reportExportDownloadUrl: (
    exportId: string,
    input?: AdminReportExportDownloadInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminReportExportDownloadUrl>(
      "POST /api/v1/admin/report-exports/{exportId}/download-url",
      { path: { exportId }, body: input ?? {}, idempotencyKey },
    ),
  refundPayment: (
    branchId: string,
    paymentId: string,
    input: AdminPaymentRefundInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminPaymentRefund>(
      "POST /api/v1/admin/branches/{branchId}/payments/{paymentId}/refunds",
      { path: { branchId, paymentId }, body: input, idempotencyKey },
    ),
  paymentRefund: (branchId: string, paymentId: string, refundId: string) =>
    executeApiOperation<AdminPaymentRefund>(
      "GET /api/v1/admin/branches/{branchId}/payments/{paymentId}/refunds/{refundId}",
      { path: { branchId, paymentId, refundId } },
    ),
  auditLogs: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminAuditLog>>("GET /api/v1/admin/audit-logs", { query }),
  auditLog: (logId: string) =>
    executeApiOperation<AdminAuditLog>("GET /api/v1/admin/audit-logs/{logId}", {
      path: { logId },
    }),
};
