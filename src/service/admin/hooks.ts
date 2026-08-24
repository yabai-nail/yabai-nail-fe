"use client";

import type { SWRConfiguration } from "swr";

import { useApiOperation } from "../api";
import type { ApiClientError } from "../api";
import type {
  AdminAppointment,
  AdminAppointmentAllocationCandidate,
  AdminAppointmentPayment,
  AdminCalendarData,
  AdminCustomer,
  AdminCustomerBenefits,
  AdminCustomerLookupResult,
  AdminCustomerNailHistoryEntry,
  AdminCustomerNote,
  AdminDashboardData,
  AdminServiceCategory,
  AdminServiceItem,
  AdminSurcharge,
  AdminStaffMember,
  AdminStaffPerformance,
  AdminStaffShift,
  AdminStaffSkill,
  AdminAccount,
  AdminAuditLog,
  AdminBranch,
  AdminBranchSettings,
  AdminLoyaltyConfig,
  AdminSystemConfig,
  AdminConversation,
  AdminMessage,
  AdminNailDesign,
  AdminNotificationCampaignMetrics,
  AdminPaymentRefund,
  AdminPromotion,
  AdminReview,
  AdminReport,
  AdminReportExport,
  BackendList,
  RevenueReport,
  StaffCompensation,
} from "./types";

export function useAdminDashboard(branchId: string | null, localDate?: string) {
  return useApiOperation<AdminDashboardData>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/dashboard" : null,
    { path: branchId ? { branchId } : undefined, query: { localDate } },
  );
}

export function useAdminCalendar(branchId: string | null, from: string, to: string, view?: string) {
  return useApiOperation<AdminCalendarData>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/calendar" : null,
    { path: branchId ? { branchId } : undefined, query: { from, to, view } },
  );
}

export function useAdminAppointments(branchId: string | null, query?: Readonly<Record<string, string | number | undefined>>) {
  return useApiOperation<BackendList<AdminAppointment>>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/appointments" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useAdminAppointment(branchId: string | null, appointmentId: string | null) {
  return useApiOperation<AdminAppointment>(
    branchId && appointmentId
      ? "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}"
      : null,
    { path: branchId && appointmentId ? { branchId, appointmentId } : undefined },
  );
}

export function useAdminAppointmentAllocationCandidates(
  branchId: string | null,
  appointmentId: string | null,
) {
  return useApiOperation<BackendList<AdminAppointmentAllocationCandidate>>(
    branchId && appointmentId
      ? "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/allocation-candidates"
      : null,
    { path: branchId && appointmentId ? { branchId, appointmentId } : undefined },
  );
}

export function useAdminAppointmentPayments(
  branchId: string | null,
  appointmentId: string | null,
) {
  return useApiOperation<BackendList<AdminAppointmentPayment>>(
    branchId && appointmentId
      ? "GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payments"
      : null,
    { path: branchId && appointmentId ? { branchId, appointmentId } : undefined },
  );
}

export function useAdminCustomers(branchId: string | null, query?: Readonly<Record<string, string | number | undefined>>) {
  return useApiOperation<BackendList<AdminCustomer>>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/customers" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useAdminCustomer(branchId: string | null, customerId: string | null) {
  return useApiOperation<AdminCustomer>(
    branchId && customerId
      ? "GET /api/v1/admin/branches/{branchId}/customers/{customerId}"
      : null,
    { path: branchId && customerId ? { branchId, customerId } : undefined },
  );
}

export function useAdminCustomerBenefits(branchId: string | null, customerId: string | null) {
  return useApiOperation<AdminCustomerBenefits>(
    branchId && customerId
      ? "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/benefits"
      : null,
    { path: branchId && customerId ? { branchId, customerId } : undefined },
  );
}

export function useAdminCustomerNailHistory(
  branchId: string | null,
  customerId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminCustomerNailHistoryEntry>>(
    branchId && customerId
      ? "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/nail-history"
      : null,
    { path: branchId && customerId ? { branchId, customerId } : undefined, query },
  );
}

export function useAdminCustomerNotes(
  branchId: string | null,
  customerId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminCustomerNote>>(
    branchId && customerId
      ? "GET /api/v1/admin/branches/{branchId}/customers/{customerId}/notes"
      : null,
    { path: branchId && customerId ? { branchId, customerId } : undefined, query },
  );
}

export function useAdminCustomerLookup(
  branchId: string | null,
  query: Readonly<Record<string, string | number | undefined>> | null,
) {
  // Lookup is a targeted search; a null query means "no active search", so the hook
  // stays idle rather than sending an empty request that would either 400 or return
  // the full list.
  const hasQuery = query !== null && Object.values(query).some((value) => value !== undefined && value !== "");
  return useApiOperation<AdminCustomerLookupResult>(
    branchId && hasQuery ? "GET /api/v1/admin/branches/{branchId}/customers/lookup" : null,
    {
      path: branchId ? { branchId } : undefined,
      query: hasQuery ? query ?? undefined : undefined,
    },
  );
}

export function useAdminServices(query?: Readonly<Record<string, string | number | undefined>>) {
  return useApiOperation<BackendList<AdminServiceItem>>(
    "GET /api/v1/admin/services",
    { query },
  );
}

export function useAdminServiceCategories() {
  return useApiOperation<BackendList<AdminServiceCategory>>(
    "GET /api/v1/admin/service-categories",
  );
}

export function useAdminSurcharges() {
  return useApiOperation<BackendList<AdminSurcharge>>("GET /api/v1/admin/surcharges");
}

export function useAdminStaff(query?: Readonly<Record<string, string | number | undefined>>) {
  return useApiOperation<BackendList<AdminStaffMember>>(
    "GET /api/v1/admin/staff",
    { query },
  );
}

export function useStaffCompensation(staffId: string | null, period?: string) {
  return useApiOperation<StaffCompensation>(
    staffId ? "GET /api/v1/admin/staff/{staffId}/compensation" : null,
    { path: staffId ? { staffId } : undefined, query: { period } },
  );
}

export function useStaffSkills(staffId: string | null) {
  return useApiOperation<BackendList<AdminStaffSkill>>(
    staffId ? "GET /api/v1/admin/staff/{staffId}/skills" : null,
    { path: staffId ? { staffId } : undefined },
  );
}

export function useAdminStaffShifts(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminStaffShift>>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/shifts" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useAdminStaffPerformance(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<AdminStaffPerformance>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/staff-performance" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useRevenueReport(from?: string, to?: string) {
  return useApiOperation<RevenueReport>(
    "GET /api/v1/admin/reports/revenue-summary",
    { query: { from, to } },
  );
}

// Same report, but skipped entirely until the caller has a range to ask for.
// `to` is exclusive and the backend rejects windows longer than 12 months.
export function useRevenueReportRange(from: string | null, to: string | null) {
  return useApiOperation<RevenueReport>(
    from && to ? "GET /api/v1/admin/reports/revenue-summary" : null,
    { query: { from: from ?? undefined, to: to ?? undefined } },
  );
}

export function useAdminBranchesReport(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<AdminReport>("GET /api/v1/admin/reports/branches", { query });
}

export function useAdminCustomersReport(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<AdminReport>("GET /api/v1/admin/reports/customers", { query });
}

export function useAdminStaffPerformanceReport(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<AdminReport>("GET /api/v1/admin/reports/staff-performance", { query });
}

// Export builds run on a background worker, so the caller has to poll. Pass a
// function refreshInterval — SWR re-evaluates it after every response, so
// answering 0 once the backend reaches READY or FAILED stops the poll instead
// of leaving it hammering the endpoint forever.
export function useAdminReportExport(
  exportId: string | null,
  config?: SWRConfiguration<AdminReportExport, ApiClientError>,
) {
  return useApiOperation<AdminReportExport>(
    exportId ? "GET /api/v1/admin/report-exports/{exportId}" : null,
    { path: exportId ? { exportId } : undefined },
    config,
  );
}

/** True once the backend will never move this export again. */
export function isReportExportSettled(status: string | undefined): boolean {
  return status === "READY" || status === "FAILED";
}

export function useAdminPaymentRefund(
  branchId: string | null,
  paymentId: string | null,
  refundId: string | null,
) {
  return useApiOperation<AdminPaymentRefund>(
    branchId && paymentId && refundId
      ? "GET /api/v1/admin/branches/{branchId}/payments/{paymentId}/refunds/{refundId}"
      : null,
    {
      path:
        branchId && paymentId && refundId
          ? { branchId, paymentId, refundId }
          : undefined,
    },
  );
}

export function useAdminAuditLogs(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminAuditLog>>("GET /api/v1/admin/audit-logs", { query });
}

export function useAdminAuditLog(logId: string | null) {
  return useApiOperation<AdminAuditLog>(
    logId ? "GET /api/v1/admin/audit-logs/{logId}" : null,
    { path: logId ? { logId } : undefined },
  );
}

export function useAdminConversations(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminConversation>>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/conversations" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useAdminConversationMessages(
  branchId: string | null,
  conversationId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminMessage>>(
    branchId && conversationId
      ? "GET /api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages"
      : null,
    {
      path: branchId && conversationId ? { branchId, conversationId } : undefined,
      query,
    },
  );
}

export function useAdminBranchReviews(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminReview>>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/reviews" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useAdminReviews(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminReview>>("GET /api/v1/admin/reviews", { query });
}

export function useAdminBranchSettings(branchId: string | null) {
  return useApiOperation<AdminBranchSettings>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/settings" : null,
    { path: branchId ? { branchId } : undefined },
  );
}

export function useAdminPromotions(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminPromotion>>("GET /api/v1/admin/promotions", { query });
}

export function useAdminNotificationCampaignMetrics(campaignId: string | null) {
  return useApiOperation<AdminNotificationCampaignMetrics>(
    campaignId ? "GET /api/v1/admin/notification-campaigns/{campaignId}/metrics" : null,
    { path: campaignId ? { campaignId } : undefined },
  );
}

export function useAdminNailDesigns(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminNailDesign>>("GET /api/v1/admin/nail-designs", { query });
}

export function useAdminBranchList(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminBranch>>("GET /api/v1/admin/branches", { query });
}

export function useAdminBranchDetail(branchId: string | null) {
  return useApiOperation<AdminBranch>(
    branchId ? "GET /api/v1/admin/branches/{branchId}" : null,
    { path: branchId ? { branchId } : undefined },
  );
}

export function useAdminAccounts(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<AdminAccount>>("GET /api/v1/admin/accounts", { query });
}

export function useAdminLoyaltyConfig() {
  return useApiOperation<AdminLoyaltyConfig>("GET /api/v1/admin/loyalty-config");
}

export function useAdminSystemConfig() {
  return useApiOperation<AdminSystemConfig>("GET /api/v1/admin/system-config");
}
