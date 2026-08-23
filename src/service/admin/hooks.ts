"use client";

import { useApiOperation } from "../api";
import type {
  AdminAppointment,
  AdminAppointmentAllocationCandidate,
  AdminAppointmentPayment,
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

export function useRevenueReport(from?: string, to?: string) {
  return useApiOperation<RevenueReport>(
    "GET /api/v1/admin/reports/revenue-summary",
    { query: { from, to } },
  );
}
