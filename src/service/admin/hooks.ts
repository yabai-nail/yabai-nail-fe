"use client";

import { useApiOperation, usePaginatedApiOperation } from "../api";
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
  AdminServiceAddonConfiguration,
  AdminHomeBanners,
  AdminSurcharge,
  AdminStaffMember,
  AdminStaffPerformance,
  AdminStaffSkillSet,
  AdminStaffShift,
  AdminAccount,
  AdminAuditLog,
  AdminBranch,
  AdminBranchSettings,
  AdminLoyaltyConfig,
  AdminSystemConfig,
  AdminConversation,
  AdminMessage,
  AdminNailDesign,
  AdminNailDesignProposal,
  AdminLeaveRequest,
  AdminNotificationCampaign,
  AdminNotificationCampaignMetrics,
  AdminPaymentRefund,
  AdminPromotion,
  AdminReview,
  AdminReport,
  AdminReportExport,
  BackendList,
  RevenueReport,
  StaffCompensation,
  AdminAccountRoles,
  AdminMyPayroll,
  AdminPayrollSheet,
  AdminSalesReport,
  AdminSalesReportPreview,
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
  return usePaginatedApiOperation<AdminAppointment>(
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
  return usePaginatedApiOperation<AdminCustomer>(
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
  return usePaginatedApiOperation<AdminCustomerNailHistoryEntry>(
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
  return usePaginatedApiOperation<AdminCustomerNote>(
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

export function useAdminServices(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return usePaginatedApiOperation<AdminServiceItem>(
    enabled ? "GET /api/v1/admin/services" : null,
    { query },
  );
}

export function useAdminServiceCategories() {
  return usePaginatedApiOperation<AdminServiceCategory>(
    "GET /api/v1/admin/service-categories",
  );
}

export function useAdminServiceAddons(serviceId: string | null) {
  return useApiOperation<AdminServiceAddonConfiguration>(
    serviceId ? "GET /api/v1/admin/services/{serviceId}/add-ons" : null,
    { path: serviceId ? { serviceId } : undefined },
  );
}

export function useAdminSurcharges() {
  return usePaginatedApiOperation<AdminSurcharge>("GET /api/v1/admin/surcharges");
}

export function useAdminStaff(query?: Readonly<Record<string, string | number | undefined>>, enabled = true) {
  return usePaginatedApiOperation<AdminStaffMember>(
    enabled ? "GET /api/v1/admin/staff" : null,
    { query },
  );
}

export function useAdminStaffMember(staffId: string | null) {
  return useApiOperation<AdminStaffMember>(
    staffId ? "GET /api/v1/admin/staff/{staffId}" : null,
    { path: staffId ? { staffId } : undefined },
  );
}

export function useStaffCompensation(staffId: string | null, period?: string) {
  return useApiOperation<StaffCompensation>(
    staffId ? "GET /api/v1/admin/staff/{staffId}/compensation" : null,
    { path: staffId ? { staffId } : undefined, query: { period } },
  );
}

export function useStaffSkills(staffId: string | null) {
  return useApiOperation<AdminStaffSkillSet>(
    staffId ? "GET /api/v1/admin/staff/{staffId}/skills" : null,
    { path: staffId ? { staffId } : undefined },
  );
}

export function useAdminStaffShifts(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return usePaginatedApiOperation<AdminStaffShift>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/shifts" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useAdminStaffPerformance(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return useApiOperation<AdminStaffPerformance>(
    branchId && enabled ? "GET /api/v1/admin/branches/{branchId}/staff-performance" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useRevenueReport(from?: string, to?: string, enabled = true) {
  return useApiOperation<RevenueReport>(
    enabled ? "GET /api/v1/admin/reports/revenue-summary" : null,
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
  enabled = true,
) {
  return useApiOperation<AdminReport>(enabled ? "GET /api/v1/admin/reports/branches" : null, { query });
}

export function useAdminCustomersReport(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return useApiOperation<AdminReport>(enabled ? "GET /api/v1/admin/reports/customers" : null, { query });
}

export function useAdminStaffPerformanceReport(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return useApiOperation<AdminReport>(enabled ? "GET /api/v1/admin/reports/staff-performance" : null, { query });
}

export function useAdminReportExport(exportId: string | null) {
  return useApiOperation<AdminReportExport>(
    exportId ? "GET /api/v1/admin/report-exports/{exportId}" : null,
    { path: exportId ? { exportId } : undefined },
  );
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
  return usePaginatedApiOperation<AdminAuditLog>("GET /api/v1/admin/audit-logs", { query });
}

export function useAdminAuditLog(logId: string | null) {
  return useApiOperation<AdminAuditLog>(
    logId ? "GET /api/v1/admin/audit-logs/{logId}" : null,
    { path: logId ? { logId } : undefined },
  );
}

export function useAdminConversations(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return usePaginatedApiOperation<AdminConversation>(
    "GET /api/v1/admin/conversations",
    { query },
    { refreshInterval: 5_000 },
  );
}

export function useAdminConversationMessages(
  conversationId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return usePaginatedApiOperation<AdminMessage>(
    conversationId ? "GET /api/v1/admin/conversations/{conversationId}/messages" : null,
    {
      path: conversationId ? { conversationId } : undefined,
      query,
    },
    { refreshInterval: 5_000 },
  );
}

export function useAdminBranchReviews(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return usePaginatedApiOperation<AdminReview>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/reviews" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useAdminReviews(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return usePaginatedApiOperation<AdminReview>(enabled ? "GET /api/v1/admin/reviews" : null, { query });
}

export function useAdminBranchSettings(branchId: string | null) {
  return useApiOperation<AdminBranchSettings>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/settings" : null,
    { path: branchId ? { branchId } : undefined },
  );
}

export function useAdminHomeBanners() {
  return useApiOperation<AdminHomeBanners>("GET /api/v1/admin/home-banners");
}

export function useAdminPromotions(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return usePaginatedApiOperation<AdminPromotion>(enabled ? "GET /api/v1/admin/promotions" : null, { query });
}

export function useAdminNotificationCampaignMetrics(campaignId: string | null) {
  return useApiOperation<AdminNotificationCampaignMetrics>(
    campaignId ? "GET /api/v1/admin/notification-campaigns/{campaignId}/metrics" : null,
    { path: campaignId ? { campaignId } : undefined },
  );
}

export function useAdminNotificationCampaigns(enabled = true) {
  return usePaginatedApiOperation<AdminNotificationCampaign>(
    enabled ? "GET /api/v1/admin/notification-campaigns" : null,
  );
}

export function useAdminLeaveRequests(branchId: string | null) {
  return usePaginatedApiOperation<AdminLeaveRequest>(
    branchId ? "GET /api/v1/admin/branches/{branchId}/leave-requests" : null,
    { path: branchId ? { branchId } : undefined },
  );
}

export function useAdminNailDesigns(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return usePaginatedApiOperation<AdminNailDesign>(enabled ? "GET /api/v1/admin/nail-designs" : null, { query });
}

export function useAdminNailDesignProposals(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return usePaginatedApiOperation<AdminNailDesignProposal>(
    enabled ? "GET /api/v1/admin/nail-design-proposals" : null,
    { query },
  );
}

export function useAdminBranchList(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return usePaginatedApiOperation<AdminBranch>(enabled ? "GET /api/v1/admin/branches" : null, { query });
}

export function useAdminBranchDetail(branchId: string | null) {
  return useApiOperation<AdminBranch>(
    branchId ? "GET /api/v1/admin/branches/{branchId}" : null,
    { path: branchId ? { branchId } : undefined },
  );
}

export function useAdminAccounts(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return usePaginatedApiOperation<AdminAccount>(enabled ? "GET /api/v1/admin/accounts" : null, { query });
}

export function useAdminLoyaltyConfig() {
  return useApiOperation<AdminLoyaltyConfig>("GET /api/v1/admin/loyalty-config");
}

export function useAdminSystemConfig() {
  return useApiOperation<AdminSystemConfig>("GET /api/v1/admin/system-config");
}

// -- Sales reports and payroll ----------------------------------------------------------

export function useAdminSalesReports(
  query?: Readonly<Record<string, string | number | undefined>>,
  enabled = true,
) {
  return usePaginatedApiOperation<AdminSalesReport>(enabled ? "GET /api/v1/admin/sales-reports" : null, { query });
}

/** Prices a draft without saving it; pass null while the form is incomplete. */
export function useAdminSalesReportPreview(query: Readonly<Record<string, string | number | undefined>> | null) {
  return useApiOperation<AdminSalesReportPreview>(query ? "GET /api/v1/admin/sales-reports/preview" : null, {
    query: query ?? undefined,
  });
}

export function useAdminPayroll(query: { readonly branchId: string; readonly period: string } | null) {
  return useApiOperation<AdminPayrollSheet>(query ? "GET /api/v1/admin/payroll" : null, { query: query ?? undefined });
}

export function useAdminAccountRoles() {
  return useApiOperation<AdminAccountRoles>("GET /api/v1/admin/accounts/roles");
}

export function useAdminMyPayroll(period: string | null) {
  return useApiOperation<AdminMyPayroll>("GET /api/v1/admin/me/payroll", { query: period ? { period } : undefined });
}
