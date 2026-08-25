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
  AdminStaffSkillSet,
  AdminStaffSkillsInput,
  AdminAccount,
  AdminAccountDraft,
  AdminAccountPasswordReset,
  AdminAccountPasswordResetInput,
  AdminAccountPatch,
  AdminAudiencePreview,
  AdminAudiencePreviewInput,
  AdminAuditLog,
  AdminBranch,
  AdminBranchDraft,
  AdminBranchPatch,
  AdminBranchSettings,
  AdminCheckInResolution,
  AdminCheckInResolutionInput,
  AdminLoyaltyConfig,
  AdminMembershipCardResolution,
  AdminMembershipCardResolutionInput,
  AdminSystemConfig,
  AdminBranchSettingsPatch,
  AdminConversation,
  AdminConversationPatch,
  AdminMessage,
  AdminMessageDraft,
  AdminNailDesign,
  AdminNailDesignDraft,
  AdminNailDesignPatch,
  AdminNailDesignProposal,
  AdminNailDesignProposalDecisionInput,
  AdminNotificationCampaign,
  AdminNotificationCampaignDraft,
  AdminNotificationCampaignMetrics,
  AdminPaymentRefund,
  AdminReview,
  AdminReviewHandlingPatch,
  AdminReviewReplyInput,
  AdminPaymentRefundInput,
  AdminPromotion,
  AdminPromotionDraft,
  AdminPromotionIssuance,
  AdminPromotionIssuanceInput,
  AdminPromotionPatch,
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
  // Both payment calls are version-checked by the backend: without `If-Match`
  // it answers 422 "If-Match bat buoc." and no payment is ever recorded.
  recordAppointmentPayment: (
    branchId: string,
    appointmentId: string,
    input: AdminAppointmentPaymentInput,
    version?: string | number,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminAppointmentPayment>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payments",
      { path: { branchId, appointmentId }, body: input, version, idempotencyKey },
    ),
  requestAppointmentPaymentQuote: (
    branchId: string,
    appointmentId: string,
    input?: Readonly<Record<string, unknown>>,
    version?: string | number,
  ) =>
    executeApiOperation<AdminAppointmentPaymentQuote>(
      "POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payment-quotes",
      { path: { branchId, appointmentId }, body: input ?? {}, version },
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
    executeApiOperation<AdminStaffSkillSet>(
      "GET /api/v1/admin/staff/{staffId}/skills",
      { path: { staffId } },
    ),
  setStaffSkills: (staffId: string, input: AdminStaffSkillsInput, version?: string | number) =>
    executeApiOperation<AdminStaffSkillSet>(
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
  conversations: (
    branchId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<BackendList<AdminConversation>>(
      "GET /api/v1/admin/branches/{branchId}/conversations",
      { path: { branchId }, query },
    ),
  conversationMessages: (
    branchId: string,
    conversationId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<BackendList<AdminMessage>>(
      "GET /api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages",
      { path: { branchId, conversationId }, query },
    ),
  sendConversationMessage: (
    branchId: string,
    conversationId: string,
    draft: AdminMessageDraft,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminMessage>(
      "POST /api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages",
      { path: { branchId, conversationId }, body: draft, idempotencyKey },
    ),
  updateConversation: (
    branchId: string,
    conversationId: string,
    patch: AdminConversationPatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminConversation>(
      "PATCH /api/v1/admin/branches/{branchId}/conversations/{conversationId}",
      { path: { branchId, conversationId }, body: patch, version },
    ),
  branchReviews: (
    branchId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<BackendList<AdminReview>>(
      "GET /api/v1/admin/branches/{branchId}/reviews",
      { path: { branchId }, query },
    ),
  updateBranchReviewHandling: (
    branchId: string,
    reviewId: string,
    patch: AdminReviewHandlingPatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminReview>(
      "PATCH /api/v1/admin/branches/{branchId}/reviews/{reviewId}/handling",
      { path: { branchId, reviewId }, body: patch, version },
    ),
  replyToBranchReview: (
    branchId: string,
    reviewId: string,
    input: AdminReviewReplyInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminReview>(
      "POST /api/v1/admin/branches/{branchId}/reviews/{reviewId}/replies",
      { path: { branchId, reviewId }, body: input, idempotencyKey },
    ),
  reviews: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminReview>>("GET /api/v1/admin/reviews", { query }),
  branchSettings: (branchId: string) =>
    executeApiOperation<AdminBranchSettings>(
      "GET /api/v1/admin/branches/{branchId}/settings",
      { path: { branchId } },
    ),
  updateBranchSettings: (
    branchId: string,
    patch: AdminBranchSettingsPatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminBranchSettings>(
      "PATCH /api/v1/admin/branches/{branchId}/settings",
      { path: { branchId }, body: patch, version },
    ),
  promotions: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminPromotion>>("GET /api/v1/admin/promotions", { query }),
  createPromotion: (draft: AdminPromotionDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminPromotion>("POST /api/v1/admin/promotions", {
      body: draft,
      idempotencyKey,
    }),
  updatePromotion: (
    promotionId: string,
    patch: AdminPromotionPatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminPromotion>("PATCH /api/v1/admin/promotions/{promotionId}", {
      path: { promotionId },
      body: patch,
      version,
    }),
  issuePromotion: (
    promotionId: string,
    input: AdminPromotionIssuanceInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminPromotionIssuance>(
      "POST /api/v1/admin/promotions/{promotionId}/issuances",
      { path: { promotionId }, body: input, idempotencyKey },
    ),
  createNotificationCampaign: (
    draft: AdminNotificationCampaignDraft,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminNotificationCampaign>("POST /api/v1/admin/notification-campaigns", {
      body: draft,
      idempotencyKey,
    }),
  cancelNotificationCampaign: (
    campaignId: string,
    input?: Readonly<Record<string, unknown>>,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminNotificationCampaign>(
      "POST /api/v1/admin/notification-campaigns/{campaignId}/cancellation",
      { path: { campaignId }, body: input ?? {}, idempotencyKey },
    ),
  notificationCampaignMetrics: (campaignId: string) =>
    executeApiOperation<AdminNotificationCampaignMetrics>(
      "GET /api/v1/admin/notification-campaigns/{campaignId}/metrics",
      { path: { campaignId } },
    ),
  notificationCampaignAudiencePreview: (
    input: AdminAudiencePreviewInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminAudiencePreview>(
      "POST /api/v1/admin/notification-campaigns/audience-previews",
      { body: input, idempotencyKey },
    ),
  previewAudience: (input: AdminAudiencePreviewInput, idempotencyKey?: string) =>
    executeApiOperation<AdminAudiencePreview>("POST /api/v1/admin/audiences/previews", {
      body: input,
      idempotencyKey,
    }),
  nailDesigns: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminNailDesign>>("GET /api/v1/admin/nail-designs", { query }),
  createNailDesign: (draft: AdminNailDesignDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminNailDesign>("POST /api/v1/admin/nail-designs", {
      body: draft,
      idempotencyKey,
    }),
  updateNailDesign: (
    designId: string,
    patch: AdminNailDesignPatch,
    version?: string | number,
  ) =>
    executeApiOperation<AdminNailDesign>("PATCH /api/v1/admin/nail-designs/{designId}", {
      path: { designId },
      body: patch,
      version,
    }),
  decideNailDesignProposal: (
    proposalId: string,
    input: AdminNailDesignProposalDecisionInput,
    version?: string | number,
  ) =>
    executeApiOperation<AdminNailDesignProposal>(
      "POST /api/v1/admin/nail-design-proposals/{proposalId}/decision",
      { path: { proposalId }, body: input, version },
    ),
  branches: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminBranch>>("GET /api/v1/admin/branches", { query }),
  createBranch: (draft: AdminBranchDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminBranch>("POST /api/v1/admin/branches", {
      body: draft,
      idempotencyKey,
    }),
  branch: (branchId: string) =>
    executeApiOperation<AdminBranch>("GET /api/v1/admin/branches/{branchId}", {
      path: { branchId },
    }),
  updateBranch: (branchId: string, patch: AdminBranchPatch, version?: string | number) =>
    executeApiOperation<AdminBranch>("PATCH /api/v1/admin/branches/{branchId}", {
      path: { branchId },
      body: patch,
      version,
    }),
  accounts: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<AdminAccount>>("GET /api/v1/admin/accounts", { query }),
  createAccount: (draft: AdminAccountDraft, idempotencyKey?: string) =>
    executeApiOperation<AdminAccount>("POST /api/v1/admin/accounts", {
      body: draft,
      idempotencyKey,
    }),
  updateAccount: (accountId: string, patch: AdminAccountPatch, version?: string | number) =>
    executeApiOperation<AdminAccount>("PATCH /api/v1/admin/accounts/{accountId}", {
      path: { accountId },
      body: patch,
      version,
    }),
  resetAccountPassword: (
    accountId: string,
    input: AdminAccountPasswordResetInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminAccountPasswordReset>(
      "POST /api/v1/admin/accounts/{accountId}/password-resets",
      { path: { accountId }, body: input, idempotencyKey },
    ),
  loyaltyConfig: () =>
    executeApiOperation<AdminLoyaltyConfig>("GET /api/v1/admin/loyalty-config"),
  updateLoyaltyConfig: (patch: Readonly<Record<string, unknown>>, version?: string | number) =>
    executeApiOperation<AdminLoyaltyConfig>("PUT /api/v1/admin/loyalty-config", {
      body: patch,
      version,
    }),
  systemConfig: () =>
    executeApiOperation<AdminSystemConfig>("GET /api/v1/admin/system-config"),
  updateSystemConfig: (patch: Readonly<Record<string, unknown>>, version?: string | number) =>
    executeApiOperation<AdminSystemConfig>("PATCH /api/v1/admin/system-config", {
      body: patch,
      version,
    }),
  resolveCheckIn: (
    branchId: string,
    input: AdminCheckInResolutionInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminCheckInResolution>(
      "POST /api/v1/admin/branches/{branchId}/check-in-resolutions",
      { path: { branchId }, body: input, idempotencyKey },
    ),
  resolveMembershipCard: (
    branchId: string,
    input: AdminMembershipCardResolutionInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<AdminMembershipCardResolution>(
      "POST /api/v1/admin/branches/{branchId}/membership-card-resolutions",
      { path: { branchId }, body: input, idempotencyKey },
    ),
};
