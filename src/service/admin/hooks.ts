"use client";

import { useApiOperation } from "../api";
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
  AdminStaffMember,
  AdminStaffPerformance,
  AdminStaffShift,
  AdminStaffSkill,
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
