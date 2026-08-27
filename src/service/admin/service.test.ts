import { describe, expect, it, vi } from "vitest";

const { executeApiOperation } = vi.hoisted(() => ({ executeApiOperation: vi.fn() }));

vi.mock("../api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api")>()),
  executeApiOperation,
}));

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

const FOUNDATION_OPERATION_IDS = [
  "GET /api/v1/admin/branches",
  "POST /api/v1/admin/branches",
  "GET /api/v1/admin/branches/{branchId}",
  "PATCH /api/v1/admin/branches/{branchId}",
  "GET /api/v1/admin/accounts",
  "POST /api/v1/admin/accounts",
  "PATCH /api/v1/admin/accounts/{accountId}",
  "POST /api/v1/admin/accounts/{accountId}/password-resets",
  "GET /api/v1/admin/loyalty-config",
  "PUT /api/v1/admin/loyalty-config",
  "GET /api/v1/admin/system-config",
  "PATCH /api/v1/admin/system-config",
  "POST /api/v1/admin/branches/{branchId}/check-in-resolutions",
  "POST /api/v1/admin/branches/{branchId}/membership-card-resolutions",
] as const;

const MARKETING_OPERATION_IDS = [
  "GET /api/v1/admin/promotions",
  "POST /api/v1/admin/promotions",
  "PATCH /api/v1/admin/promotions/{promotionId}",
  "POST /api/v1/admin/promotions/{promotionId}/issuances",
  "POST /api/v1/admin/notification-campaigns",
  "GET /api/v1/admin/notification-campaigns",
  "POST /api/v1/admin/notification-campaigns/{campaignId}/cancellation",
  "GET /api/v1/admin/notification-campaigns/{campaignId}/metrics",
  "POST /api/v1/admin/notification-campaigns/audience-previews",
  "POST /api/v1/admin/audiences/previews",
  "GET /api/v1/admin/nail-designs",
  "POST /api/v1/admin/nail-designs",
  "PATCH /api/v1/admin/nail-designs/{designId}",
  "GET /api/v1/admin/nail-design-proposals/{proposalId}",
  "POST /api/v1/admin/nail-design-proposals/{proposalId}/decision",
] as const;

const MESSAGING_OPERATION_IDS = [
  "GET /api/v1/admin/conversations",
  "GET /api/v1/admin/conversations/{conversationId}/messages",
  "POST /api/v1/admin/conversations/{conversationId}/messages",
  "PATCH /api/v1/admin/conversations/{conversationId}",
  "GET /api/v1/admin/branches/{branchId}/reviews",
  "PATCH /api/v1/admin/branches/{branchId}/reviews/{reviewId}/handling",
  "POST /api/v1/admin/branches/{branchId}/reviews/{reviewId}/replies",
  "GET /api/v1/admin/reviews",
  "GET /api/v1/admin/branches/{branchId}/settings",
  "PATCH /api/v1/admin/branches/{branchId}/settings",
] as const;

const FINANCE_OPERATION_IDS = [
  "GET /api/v1/admin/reports/revenue-summary",
  "GET /api/v1/admin/reports/branches",
  "GET /api/v1/admin/reports/customers",
  "GET /api/v1/admin/reports/staff-performance",
  "POST /api/v1/admin/report-exports",
  "GET /api/v1/admin/report-exports/{exportId}",
  "POST /api/v1/admin/report-exports/{exportId}/download-url",
  "GET /api/v1/admin/branches/{branchId}/payments/{paymentId}",
  "POST /api/v1/admin/branches/{branchId}/payments/{paymentId}/refunds",
  "GET /api/v1/admin/branches/{branchId}/payments/{paymentId}/refunds/{refundId}",
  "GET /api/v1/admin/audit-logs",
  "GET /api/v1/admin/audit-logs/{logId}",
] as const;

const CATALOG_OPERATION_IDS = [
  "GET /api/v1/admin/services",
  "POST /api/v1/admin/services",
  "PATCH /api/v1/admin/services/{serviceId}",
  "GET /api/v1/admin/service-categories",
  "POST /api/v1/admin/service-categories",
  "PATCH /api/v1/admin/service-categories/{categoryId}",
  "POST /api/v1/admin/service-categories/reorder",
  "GET /api/v1/admin/surcharges",
  "POST /api/v1/admin/surcharges",
  "PATCH /api/v1/admin/surcharges/{surchargeId}",
] as const;

const STAFF_OPERATION_IDS = [
  "GET /api/v1/admin/staff",
  "POST /api/v1/admin/staff",
  "GET /api/v1/admin/staff/{staffId}",
  "PATCH /api/v1/admin/staff/{staffId}",
  "GET /api/v1/admin/staff/{staffId}/compensation",
  "PUT /api/v1/admin/staff/{staffId}/compensation",
  "GET /api/v1/admin/staff/{staffId}/skills",
  "PUT /api/v1/admin/staff/{staffId}/skills",
  "GET /api/v1/admin/branches/{branchId}/shifts",
  "POST /api/v1/admin/branches/{branchId}/shifts",
  "POST /api/v1/admin/branches/{branchId}/leave-requests",
  "GET /api/v1/admin/branches/{branchId}/leave-requests",
  "POST /api/v1/admin/branches/{branchId}/leave-requests/{requestId}/decision",
  "GET /api/v1/admin/branches/{branchId}/staff-performance",
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

describe("adminService foundation surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of FOUNDATION_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each foundation operation", () => {
    for (const fn of [
      adminService.branches,
      adminService.createBranch,
      adminService.branch,
      adminService.updateBranch,
      adminService.accounts,
      adminService.createAccount,
      adminService.updateAccount,
      adminService.resetAccountPassword,
      adminService.loyaltyConfig,
      adminService.updateLoyaltyConfig,
      adminService.systemConfig,
      adminService.updateSystemConfig,
      adminService.resolveCheckIn,
      adminService.resolveMembershipCard,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});

describe("adminService marketing surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of MARKETING_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each marketing operation", () => {
    for (const fn of [
      adminService.promotions,
      adminService.createPromotion,
      adminService.updatePromotion,
      adminService.issuePromotion,
      adminService.createNotificationCampaign,
      adminService.notificationCampaigns,
      adminService.cancelNotificationCampaign,
      adminService.notificationCampaignMetrics,
      adminService.notificationCampaignAudiencePreview,
      adminService.previewAudience,
      adminService.nailDesigns,
      adminService.createNailDesign,
      adminService.updateNailDesign,
      adminService.nailDesignProposal,
      adminService.decideNailDesignProposal,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});

describe("adminService messaging and reviews surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of MESSAGING_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each messaging and review operation", () => {
    for (const fn of [
      adminService.conversations,
      adminService.conversationMessages,
      adminService.sendConversationMessage,
      adminService.updateConversation,
      adminService.branchReviews,
      adminService.updateBranchReviewHandling,
      adminService.replyToBranchReview,
      adminService.reviews,
      adminService.branchSettings,
      adminService.updateBranchSettings,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });

  it("uses the campaign and proposal contracts required by the backend", async () => {
    executeApiOperation.mockClear();

    await adminService.createNotificationCampaign({ title: "Nhắc lịch", message: "Bạn có lịch hẹn.", channel: "PUSH" });
    await adminService.cancelNotificationCampaign("campaign-a", undefined, 3, "cancel-key");
    await adminService.decideNailDesignProposal("proposal-a", { decision: "APPROVE", reason: "Đủ điều kiện" }, 5);

    expect(executeApiOperation).toHaveBeenNthCalledWith(
      1,
      "POST /api/v1/admin/notification-campaigns",
      { body: { title: "Nhắc lịch", message: "Bạn có lịch hẹn.", channel: "PUSH" }, idempotencyKey: undefined },
    );
    expect(executeApiOperation).toHaveBeenNthCalledWith(
      2,
      "POST /api/v1/admin/notification-campaigns/{campaignId}/cancellation",
      { path: { campaignId: "campaign-a" }, body: {}, version: 3, idempotencyKey: "cancel-key" },
    );
    expect(executeApiOperation).toHaveBeenNthCalledWith(
      3,
      "POST /api/v1/admin/nail-design-proposals/{proposalId}/decision",
      { path: { proposalId: "proposal-a" }, body: { decision: "APPROVE", reason: "Đủ điều kiện" }, version: 5 },
    );
  });

  it("forwards the review version required by reply If-Match", async () => {
    await adminService.replyToBranchReview("branch-a", "review-a", { content: "Cảm ơn bạn." }, 7, "reply-key");

    expect(executeApiOperation).toHaveBeenCalledWith(
      "POST /api/v1/admin/branches/{branchId}/reviews/{reviewId}/replies",
      {
        path: { branchId: "branch-a", reviewId: "review-a" },
        body: { content: "Cảm ơn bạn." },
        version: 7,
        idempotencyKey: "reply-key",
      },
    );
  });
});

describe("adminService finance and audit surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of FINANCE_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each finance and audit operation", () => {
    for (const fn of [
      adminService.revenueReport,
      adminService.branchesReport,
      adminService.customersReport,
      adminService.staffPerformanceReport,
      adminService.createReportExport,
      adminService.reportExport,
      adminService.reportExportDownloadUrl,
      adminService.payment,
      adminService.refundPayment,
      adminService.paymentRefund,
      adminService.auditLogs,
      adminService.auditLog,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });

  it("forwards the current payment version required by refund If-Match", async () => {
    executeApiOperation.mockClear();

    await adminService.refundPayment(
      "branch-a",
      "payment-a",
      { amount: 50_000, reasonCode: "CUSTOMER_REQUEST" },
      4,
      "refund-key",
    );

    expect(executeApiOperation).toHaveBeenCalledWith(
      "POST /api/v1/admin/branches/{branchId}/payments/{paymentId}/refunds",
      {
        path: { branchId: "branch-a", paymentId: "payment-a" },
        body: { amount: 50_000, reasonCode: "CUSTOMER_REQUEST" },
        version: 4,
        idempotencyKey: "refund-key",
      },
    );
  });
});

describe("adminService catalog surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of CATALOG_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each catalog operation", () => {
    for (const fn of [
      adminService.services,
      adminService.createService,
      adminService.updateService,
      adminService.serviceCategories,
      adminService.createServiceCategory,
      adminService.updateServiceCategory,
      adminService.reorderServiceCategories,
      adminService.surcharges,
      adminService.createSurcharge,
      adminService.updateSurcharge,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});

describe("adminService staff surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of STAFF_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each staff operation", () => {
    for (const fn of [
      adminService.staff,
      adminService.createStaff,
      adminService.staffMember,
      adminService.updateStaff,
      adminService.staffCompensation,
      adminService.setStaffCompensation,
      adminService.staffSkills,
      adminService.setStaffSkills,
      adminService.staffShifts,
      adminService.createStaffShift,
      adminService.createLeaveRequest,
      adminService.leaveRequests,
      adminService.decideLeaveRequest,
      adminService.staffPerformance,
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

  it("forwards customer versions and canonical loyalty fields", async () => {
    executeApiOperation.mockClear();

    await adminService.adjustCustomerPoints("branch-a", "customer-a", { pointsSigned: -10, reasonCode: "CORRECTION" }, 8, "points-key");
    await adminService.issueCustomerCoupon("branch-a", "customer-a", { couponId: "coupon-a" }, 9, "coupon-key");

    expect(executeApiOperation).toHaveBeenNthCalledWith(
      1,
      "POST /api/v1/admin/branches/{branchId}/customers/{customerId}/point-adjustments",
      { path: { branchId: "branch-a", customerId: "customer-a" }, body: { pointsSigned: -10, reasonCode: "CORRECTION" }, version: 8, idempotencyKey: "points-key" },
    );
    expect(executeApiOperation).toHaveBeenNthCalledWith(
      2,
      "POST /api/v1/admin/branches/{branchId}/customers/{customerId}/coupon-issuances",
      { path: { branchId: "branch-a", customerId: "customer-a" }, body: { couponId: "coupon-a" }, version: 9, idempotencyKey: "coupon-key" },
    );
  });
});
