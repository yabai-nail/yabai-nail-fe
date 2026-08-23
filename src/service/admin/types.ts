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

// -- Admin appointment mutations -------------------------------------------------
// Inputs stay minimally typed on top of the known fields; the `[field: string]: unknown`
// escape hatch lets a page pass through additional properties the backend expects
// without waiting on an exhaustive type export from the platform.

export interface AdminAppointmentDraft {
  readonly customerId: string;
  readonly staffId?: string | null;
  readonly serviceIds: ReadonlyArray<string>;
  readonly startsAt: string;
  readonly endsAt?: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentRescheduleInput {
  readonly startsAt: string;
  readonly endsAt?: string;
  readonly staffId?: string | null;
  readonly reason?: string;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentCancellationInput {
  readonly reason: string;
  readonly refundVnd?: number;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentAssignmentInput {
  readonly staffId: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentServiceCompletionInput {
  readonly completedAt?: string;
  readonly actualServiceIds?: ReadonlyArray<string>;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentPaymentInput {
  readonly method: string;
  readonly amountVnd: number;
  readonly discountVnd?: number;
  readonly reference?: string;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentActualServicesInput {
  readonly serviceIds: ReadonlyArray<string>;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentPhotoInput {
  readonly mediaId: string;
  readonly kind?: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentPayment {
  readonly id: string;
  readonly appointmentId: string;
  readonly method: string;
  readonly amountVnd: number;
  readonly status: string;
  readonly paidAt?: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentPaymentQuote {
  readonly appointmentId: string;
  readonly subtotalVnd: number;
  readonly discountVnd: number;
  readonly totalVnd: number;
  readonly lines: ReadonlyArray<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentAllocationCandidate {
  readonly staffId: string;
  readonly displayName: string;
  readonly score?: number;
  readonly reasons?: ReadonlyArray<string>;
  readonly [field: string]: unknown;
}
