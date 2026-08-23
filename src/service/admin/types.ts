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

// -- Admin customer mutations ----------------------------------------------------

export interface AdminCustomerDraft {
  readonly displayName?: string;
  readonly phone: string;
  readonly locale?: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminCustomerPatch {
  readonly displayName?: string;
  readonly locale?: string;
  readonly status?: string;
  readonly [field: string]: unknown;
}

export interface AdminCustomerBenefits {
  readonly customerId: string;
  readonly membershipTier?: string;
  readonly membershipProgress?: number;
  readonly points?: number;
  readonly activeCoupons?: ReadonlyArray<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

export interface AdminCustomerCouponIssuanceInput {
  readonly couponId: string;
  readonly reason?: string;
  readonly expiresAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminCustomerCouponIssuance {
  readonly id: string;
  readonly customerId: string;
  readonly couponId: string;
  readonly issuedAt: string;
  readonly expiresAt?: string;
  readonly status: string;
  readonly [field: string]: unknown;
}

export interface AdminCustomerNailHistoryEntry {
  readonly appointmentId: string;
  readonly startedAt: string;
  readonly serviceNames: ReadonlyArray<string>;
  readonly staffName?: string;
  readonly totalVnd?: number;
  readonly [field: string]: unknown;
}

export interface AdminCustomerNote {
  readonly id: string;
  readonly customerId: string;
  readonly authorId?: string;
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly pinned?: boolean;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminCustomerNoteDraft {
  readonly content: string;
  readonly pinned?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminCustomerNotePatch {
  readonly content?: string;
  readonly pinned?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminCustomerPointAdjustmentInput {
  readonly deltaPoints: number;
  readonly reason: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminCustomerPointAdjustment {
  readonly id: string;
  readonly customerId: string;
  readonly deltaPoints: number;
  readonly balanceAfter?: number;
  readonly createdAt: string;
  readonly [field: string]: unknown;
}

export interface AdminCustomerLookupResult {
  readonly items: ReadonlyArray<AdminCustomer>;
  readonly matchedBy?: string;
}

// -- Admin staff mutations -------------------------------------------------------

export interface AdminStaffDraft {
  readonly displayName: string;
  readonly branchId: string;
  readonly serviceIds?: ReadonlyArray<string>;
  readonly phone?: string;
  readonly role?: string;
  readonly active?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminStaffPatch {
  readonly displayName?: string;
  readonly branchId?: string;
  readonly serviceIds?: ReadonlyArray<string>;
  readonly active?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminStaffCompensationInput {
  readonly baseSalaryVnd: number;
  readonly commissionRate: number;
  readonly effectiveFrom?: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminStaffSkill {
  readonly serviceId: string;
  readonly level?: string;
  readonly certifiedAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminStaffSkillsInput {
  readonly skills: ReadonlyArray<AdminStaffSkill>;
  readonly [field: string]: unknown;
}

export interface AdminStaffShift {
  readonly id: string;
  readonly staffId: string;
  readonly branchId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status?: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminStaffShiftDraft {
  readonly staffId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminLeaveRequest {
  readonly id: string;
  readonly staffId: string;
  readonly branchId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly reason?: string;
  readonly status: string;
  readonly decidedAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminLeaveRequestDraft {
  readonly staffId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly reason?: string;
  readonly [field: string]: unknown;
}

export interface AdminLeaveRequestDecisionInput {
  readonly decision: "approve" | "reject";
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminStaffPerformance {
  readonly branchId: string;
  readonly period: string;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
  readonly totals?: Readonly<Record<string, number>>;
  readonly [field: string]: unknown;
}

// -- Admin service catalog & surcharges ------------------------------------------

export interface AdminServiceItemDraft {
  readonly name: string;
  readonly categoryId?: string;
  readonly priceVnd: number;
  readonly durationMinutes: number;
  readonly description?: string;
  readonly nameJa?: string;
  readonly active?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminServiceItemPatch {
  readonly name?: string;
  readonly categoryId?: string;
  readonly priceVnd?: number;
  readonly durationMinutes?: number;
  readonly description?: string;
  readonly nameJa?: string;
  readonly active?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminServiceCategoryDraft {
  readonly code: string;
  readonly name: string;
  readonly nameVi?: string;
  readonly serviceIds?: ReadonlyArray<string>;
  readonly status?: string;
  readonly [field: string]: unknown;
}

export interface AdminServiceCategoryPatch {
  readonly code?: string;
  readonly name?: string;
  readonly nameVi?: string;
  readonly serviceIds?: ReadonlyArray<string>;
  readonly status?: string;
  readonly [field: string]: unknown;
}

export interface AdminServiceCategoryReorderInput {
  readonly orderedCategoryIds: ReadonlyArray<string>;
  readonly [field: string]: unknown;
}

export interface AdminSurcharge {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly amountVnd?: number;
  readonly percentage?: number;
  readonly active: boolean;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminSurchargeDraft {
  readonly name: string;
  readonly kind: string;
  readonly amountVnd?: number;
  readonly percentage?: number;
  readonly active?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminSurchargePatch {
  readonly name?: string;
  readonly kind?: string;
  readonly amountVnd?: number;
  readonly percentage?: number;
  readonly active?: boolean;
  readonly [field: string]: unknown;
}

// -- Admin payments / refunds ----------------------------------------------------

export interface AdminPaymentRefund {
  readonly id: string;
  readonly paymentId: string;
  readonly amountVnd: number;
  readonly reason: string;
  readonly status: string;
  readonly createdAt: string;
  readonly [field: string]: unknown;
}

export interface AdminPaymentRefundInput {
  readonly amountVnd: number;
  readonly reason: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

// -- Admin reports & exports -----------------------------------------------------

export interface AdminReportRow {
  readonly [field: string]: unknown;
}

export interface AdminReport {
  readonly metricVersion: string;
  readonly from?: string;
  readonly toExclusive?: string;
  readonly generatedAt: string;
  readonly rows: ReadonlyArray<AdminReportRow>;
  readonly totals?: Readonly<Record<string, number | null>>;
  readonly [field: string]: unknown;
}

export interface AdminReportExport {
  readonly id: string;
  readonly reportKind: string;
  readonly status: string;
  readonly requestedAt: string;
  readonly completedAt?: string;
  readonly downloadUrl?: string;
  readonly [field: string]: unknown;
}

export interface AdminReportExportInput {
  readonly reportKind: string;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

export interface AdminReportExportDownloadInput {
  readonly ttlSeconds?: number;
  readonly [field: string]: unknown;
}

export interface AdminReportExportDownloadUrl {
  readonly url: string;
  readonly expiresAt: string;
}

// -- Admin audit -----------------------------------------------------------------

export interface AdminAuditLog {
  readonly id: string;
  readonly actorId?: string;
  readonly actorType?: string;
  readonly action: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly createdAt: string;
  readonly branchId?: string;
  readonly diff?: Readonly<Record<string, unknown>>;
  readonly [field: string]: unknown;
}
