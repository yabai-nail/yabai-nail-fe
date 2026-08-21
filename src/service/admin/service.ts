import { executeApiOperation } from "../api";
import type {
  AdminAppointment,
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
