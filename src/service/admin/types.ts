export interface PageInfo {
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
  readonly limit: number;
}

export interface BackendList<T> {
  readonly items: ReadonlyArray<T>;
  readonly pageInfo?: PageInfo;
}

export interface AdminDashboardDataFreshness {
  readonly projectionThrough?: string;
  readonly lagSeconds?: number;
  readonly isProvisional?: boolean;
  readonly reconciledThroughBusinessDate?: string;
  readonly qualityFlags?: ReadonlyArray<string>;
}

// Shape observed on https://apiyabai.tedo.vn/api/v1/admin/branches/{branchId}/dashboard.
// Everything past the four appointment counters landed with BE-GAP-003; they stay
// optional so a branch served by an older deploy still type-checks and the UI can
// fall back to an explicit "chưa có dữ liệu" instead of a fabricated number.
export interface AdminDashboardKpi {
  readonly total: number;
  readonly confirmed: number;
  readonly inService: number;
  readonly completed: number;
  readonly revenueVnd?: number;
  readonly previousRevenueVnd?: number;
  readonly revenueChangePercent?: number | null;
  readonly customerCount?: number;
  readonly newCustomerCount?: number;
  readonly workingStaffCount?: number;
  readonly offStaffCount?: number;
  readonly expensesVnd?: number;
  readonly commissionVnd?: number;
  readonly salonShareVnd?: number;
}

export interface AdminDashboardData {
  readonly localDate: string;
  readonly currency?: string;
  readonly branchTimeZone?: string;
  readonly scope?: string;
  readonly kpi: AdminDashboardKpi;
  // The live branch has no captured payment yet, so the element contract is
  // still unconfirmed — kept as loose records and narrowed at the render site.
  readonly paymentMethods?: ReadonlyArray<Record<string, unknown>>;
  readonly upcoming: ReadonlyArray<AdminAppointment>;
  readonly alerts: ReadonlyArray<AdminAppointment>;
  readonly generatedAt: string;
  readonly dataFreshness?: AdminDashboardDataFreshness;
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

export interface AdminStaffPerformanceKpi {
  readonly revenueVnd?: number;
  readonly orderCount?: number;
  readonly commissionAmountVnd?: number;
  readonly activeStaffCount?: number;
}

export interface AdminStaffPerformance {
  readonly branchId: string;
  readonly period: string;
  readonly currency?: string;
  readonly branchTimeZone?: string;
  // Verified live: { staff: { id, displayName }, workingStatus, revenueVnd,
  // orderCount, commissionRate, commissionAmountVnd, version }. Kept loose here
  // because existing callers already narrow the rows themselves.
  readonly rows: ReadonlyArray<Record<string, unknown>>;
  readonly kpi?: AdminStaffPerformanceKpi;
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

// -- Admin messaging (conversations + messages) ---------------------------------

export interface AdminConversationCustomerSummary {
  readonly customerId: string;
  readonly displayName?: string;
  readonly phone?: string;
  readonly avatarUrl?: string;
  readonly [field: string]: unknown;
}

export interface AdminConversation {
  readonly id: string;
  readonly branchId: string;
  readonly status: string;
  readonly unreadCount: number;
  readonly customer: AdminConversationCustomerSummary;
  readonly lastMessage?: {
    readonly id: string;
    readonly senderType: string;
    readonly content: string;
    readonly createdAt: string;
  };
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminConversationPatch {
  readonly status: "READ" | "UNREAD" | "ARCHIVED";
  readonly [field: string]: unknown;
}

export interface AdminMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderType: string;
  readonly content: string;
  readonly createdAt: string;
  readonly deliveryStatus?: string;
  readonly [field: string]: unknown;
}

export interface AdminMessageDraft {
  readonly content: string;
  readonly attachments?: ReadonlyArray<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

// -- Admin reviews ---------------------------------------------------------------

export interface AdminReview {
  readonly id: string;
  readonly appointmentId: string;
  readonly customerId: string;
  readonly branchId: string;
  readonly rating: number;
  readonly content?: string;
  readonly status: string;
  readonly createdAt: string;
  readonly handling?: {
    readonly status: string;
    readonly assignedTo?: string;
    readonly note?: string;
  };
  readonly reply?: {
    readonly id: string;
    readonly content: string;
    readonly createdAt: string;
  };
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminReviewHandlingPatch {
  readonly status: string;
  readonly assignedTo?: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminReviewReplyInput {
  readonly content: string;
  readonly [field: string]: unknown;
}

// -- Admin branch settings -------------------------------------------------------

export interface AdminBranchSettings {
  readonly branchId: string;
  readonly booking?: Readonly<Record<string, unknown>>;
  readonly payment?: Readonly<Record<string, unknown>>;
  readonly automation?: Readonly<Record<string, unknown>>;
  readonly notification?: Readonly<Record<string, unknown>>;
  readonly backup?: Readonly<Record<string, unknown>>;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminBranchSettingsPatch {
  readonly booking?: Readonly<Record<string, unknown>>;
  readonly payment?: Readonly<Record<string, unknown>>;
  readonly automation?: Readonly<Record<string, unknown>>;
  readonly notification?: Readonly<Record<string, unknown>>;
  readonly backup?: Readonly<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

// -- Admin promotions ------------------------------------------------------------

export interface AdminPromotion {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly kind: string;
  readonly status: string;
  readonly discountVnd?: number;
  readonly percentage?: number;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminPromotionDraft {
  readonly code: string;
  readonly name: string;
  readonly kind: string;
  readonly discountVnd?: number;
  readonly percentage?: number;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminPromotionPatch {
  readonly name?: string;
  readonly status?: string;
  readonly discountVnd?: number;
  readonly percentage?: number;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminPromotionIssuanceInput {
  readonly customerIds: ReadonlyArray<string>;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminPromotionIssuance {
  readonly promotionId: string;
  readonly issuedCount: number;
  readonly failedCount: number;
  readonly [field: string]: unknown;
}

// -- Admin notification campaigns -----------------------------------------------

export interface AdminNotificationCampaign {
  readonly id: string;
  readonly name: string;
  readonly channel: string;
  readonly status: string;
  readonly scheduledAt?: string;
  readonly completedAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminNotificationCampaignDraft {
  readonly name: string;
  readonly channel: string;
  readonly template: string;
  readonly audience: Readonly<Record<string, unknown>>;
  readonly scheduledAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminNotificationCampaignMetrics {
  readonly campaignId: string;
  readonly delivered: number;
  readonly opened?: number;
  readonly clicked?: number;
  readonly failed?: number;
  readonly [field: string]: unknown;
}

export interface AdminAudiencePreviewInput {
  readonly definition: Readonly<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

export interface AdminAudiencePreview {
  readonly matchedCount: number;
  readonly sample?: ReadonlyArray<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

// -- Admin nail designs ----------------------------------------------------------

export interface AdminNailDesign {
  readonly id: string;
  readonly name: string;
  readonly imageUrl?: string;
  readonly categoryIds?: ReadonlyArray<string>;
  readonly status: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminNailDesignDraft {
  readonly name: string;
  readonly imageUrl?: string;
  readonly categoryIds?: ReadonlyArray<string>;
  readonly status?: string;
  readonly [field: string]: unknown;
}

export interface AdminNailDesignPatch {
  readonly name?: string;
  readonly imageUrl?: string;
  readonly categoryIds?: ReadonlyArray<string>;
  readonly status?: string;
  readonly [field: string]: unknown;
}

export interface AdminNailDesignProposalDecisionInput {
  readonly decision: "approve" | "reject";
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminNailDesignProposal {
  readonly id: string;
  readonly designId: string;
  readonly status: string;
  readonly decidedAt?: string;
  readonly note?: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

// -- Admin foundation: branches CRUD + accounts + configs + resolutions --------

export interface AdminBranch {
  readonly id: string;
  readonly name: string;
  readonly slug?: string;
  readonly address?: string;
  readonly phone?: string;
  /** Backend trả về cờ boolean `active`, không phải chuỗi `status`. */
  readonly active?: boolean;
  readonly timezone?: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminBranchDraft {
  readonly name: string;
  readonly slug?: string;
  readonly address?: string;
  readonly phone?: string;
  readonly timezone?: string;
  readonly [field: string]: unknown;
}

export interface AdminBranchPatch {
  readonly name?: string;
  readonly address?: string;
  readonly phone?: string;
  readonly status?: string;
  readonly timezone?: string;
  readonly [field: string]: unknown;
}

export interface AdminAccount {
  readonly id: string;
  readonly phone: string;
  readonly displayName: string;
  readonly role: string;
  readonly branchIds?: ReadonlyArray<string>;
  /** Backend trả về `accountStatus` (ACTIVE/INACTIVE/DISABLED/...), không phải `status`. */
  readonly accountStatus: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminAccountDraft {
  readonly phone: string;
  readonly displayName: string;
  readonly role: string;
  readonly branchIds?: ReadonlyArray<string>;
  readonly password?: string;
  readonly [field: string]: unknown;
}

export interface AdminAccountPatch {
  readonly displayName?: string;
  readonly role?: string;
  readonly branchIds?: ReadonlyArray<string>;
  readonly status?: string;
  readonly [field: string]: unknown;
}

export interface AdminAccountPasswordResetInput {
  readonly reason?: string;
  readonly notifyChannel?: string;
  readonly [field: string]: unknown;
}

export interface AdminAccountPasswordReset {
  readonly resetToken?: string;
  readonly expiresAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminLoyaltyConfig {
  readonly version: number;
  readonly tiers?: ReadonlyArray<Record<string, unknown>>;
  readonly rules?: Readonly<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

export interface AdminSystemConfig {
  readonly version: number;
  readonly features?: Readonly<Record<string, boolean>>;
  readonly [field: string]: unknown;
}

/**
 * The resolution endpoints identify a customer from a scanned membership QR
 * (`qrPayload`) or a typed phone number. They accept no other lookup key --
 * a plain `code` resolves to nobody and comes back 404.
 */
export interface AdminCheckInResolutionInput {
  readonly phone?: string;
  readonly qrPayload?: string;
  readonly localDate?: string;
  readonly [field: string]: unknown;
}

/** Customer card returned by both resolution endpoints. */
export interface AdminResolvedCustomer {
  readonly id: string;
  readonly displayName?: string;
  readonly phone?: string;
  readonly tier?: string;
  readonly pointBalance?: number;
  readonly [field: string]: unknown;
}

/** Read-only lookup: it reports the day's appointments, it does not check anyone in. */
export interface AdminCheckInResolution {
  readonly customer: AdminResolvedCustomer;
  readonly localDate: string;
  readonly todaysAppointments: ReadonlyArray<AdminAppointment>;
  readonly [field: string]: unknown;
}

export interface AdminMembershipCardResolutionInput {
  readonly phone?: string;
  readonly qrPayload?: string;
  readonly [field: string]: unknown;
}

export interface AdminMembershipCardResolution {
  readonly customer: AdminResolvedCustomer;
  readonly resolvedAt: string;
  readonly [field: string]: unknown;
}
