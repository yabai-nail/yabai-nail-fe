export interface PageInfo {
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
  readonly limit: number;
}

export interface BackendList<T> {
  readonly items: ReadonlyArray<T>;
  readonly pageInfo?: PageInfo;
}

export interface AdminDashboardData {
  readonly localDate: string;
  readonly kpi: {
    readonly total: number;
    readonly confirmed: number;
    readonly inService: number;
    readonly completed: number;
  };
  readonly upcoming: ReadonlyArray<AdminAppointment>;
  readonly alerts: ReadonlyArray<AdminAppointment>;
  readonly generatedAt: string;
}

export interface AdminAppointment {
  readonly id: string;
  readonly customerId: string;
  readonly branchId: string;
  readonly staffId: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly totalVnd: number;
  readonly discountVnd: number;
  readonly note?: string;
  readonly version: number;
}

export interface AdminCalendarData {
  readonly appointments: ReadonlyArray<AdminAppointment>;
  readonly resources: ReadonlyArray<AdminStaffMember>;
  readonly versionToken: string;
}

export interface AdminCustomer {
  readonly id: string;
  readonly displayName?: string;
  readonly name?: string;
  readonly phone?: string;
  readonly locale?: string;
  readonly status?: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminServiceItem {
  readonly id: string;
  readonly name: string;
  readonly nameJa?: string | null;
  readonly description?: string;
  readonly priceVnd: number;
  readonly durationMinutes: number;
  readonly active: boolean;
  readonly version: number;
}

export interface AdminServiceCategory {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly nameVi?: string;
  readonly status: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly sortOrder: number;
  readonly version: number;
}

export interface AdminStaffMember {
  readonly id: string;
  readonly displayName: string;
  readonly branchId: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly active: boolean;
  readonly version: number;
  readonly account?: {
    readonly id: string;
    readonly phone: string;
    readonly displayName: string;
    readonly role: string;
    readonly accountStatus: string;
  } | null;
}

export interface StaffCompensation {
  readonly staffId: string;
  readonly branchId: string;
  readonly baseSalaryVnd: number;
  readonly commissionRate: number;
  readonly effectiveFrom: string | null;
  readonly monthlySummary: {
    readonly period: string | null;
    readonly totalCommissionVnd: number;
    readonly transactionCount: number;
  };
  readonly lines: ReadonlyArray<Record<string, unknown>>;
  readonly status: string;
  readonly version: number;
}

export interface RevenueReport {
  readonly metricVersion: string;
  readonly currency: "VND";
  readonly from: string;
  readonly toExclusive: string;
  readonly generatedAt: string;
  readonly metrics: Readonly<Record<string, { readonly value: number | null }>>;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
}
