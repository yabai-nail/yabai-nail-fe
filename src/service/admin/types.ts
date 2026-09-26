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
  readonly revenue?: number;
  readonly previousRevenue?: number;
  readonly revenueChangePercent?: number | null;
  readonly customerCount?: number;
  readonly newCustomerCount?: number;
  readonly workingStaffCount?: number;
  readonly offStaffCount?: number;
  readonly expenses?: number;
  readonly refundTotal?: number;
  readonly commission?: number;
  readonly salonShare?: number;
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
  readonly branchTimeZone?: string;
  readonly staffId: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly total: number;
  readonly discount: number;
  readonly benefitDiscount?: number;
  readonly manualDiscount?: number;
  readonly manualDiscountReason?: string;
  readonly discountReason?: string;
  readonly checkoutNote?: string;
  readonly expectedPaymentMethod?: "CASH" | "PAYPAY" | "VISA" | null;
  readonly services?: ReadonlyArray<AdminAppointmentServiceSnapshot>;
  readonly photos?: ReadonlyArray<{ readonly mediaId: string; readonly kind: "BEFORE" | "AFTER" | "OTHER"; readonly note: string; readonly url: string }>;
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
  readonly avatarUrl?: string | null;
  readonly birthday?: string | null;
  readonly visitCount?: number;
  readonly totalSpend?: number;
  readonly preferenceSummary?: string | null;
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
  readonly price: number;
  readonly durationMinutes: number;
  readonly warrantyDays?: number;
  // Filled by the admin list endpoint, which resolves the stored key to the public one.
  readonly categoryId?: string | null;
  readonly categoryName?: string | null;
  readonly imageUrl?: string | null;
  readonly soldCount?: number;
  readonly isFeatured?: boolean;
  readonly serviceType?: "BASE" | "ADD_ON";
  readonly addonGroup?: string | null;
  readonly bookableStandalone?: boolean;
  /** Marks the explicit customer choice that means no option from its add-on group. */
  readonly representsNoSelection?: boolean;
  readonly active: boolean;
  readonly version: number;
}

export interface AdminServiceCategory {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly nameVi?: string;
  // Stored in the record payload and returned by both the admin and the public read.
  readonly nameJa?: string | null;
  // Empty means every branch shows the category.
  readonly branchIds?: ReadonlyArray<string>;
  readonly branchScope?: ReadonlyArray<string>;
  readonly status: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly sortOrder: number;
  readonly version: number;
}

export interface AdminStaffMember {
  readonly id: string;
  readonly displayName: string;
  readonly branchId: string;
  /** Public media URL of the profile photo; null when none is set. */
  readonly avatarUrl?: string | null;
  /** The login this profile belongs to; null until linked. A STAFF login without a profile cannot sign in. */
  readonly accountId?: string | null;
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
  readonly baseSalary: number;
  readonly commissionRate: number;
  /** The rate for jobs booked through the customer app; equals commissionRate until the salon sets one. */
  readonly appCommissionRate: number;
  readonly effectiveFrom: string | null;
  readonly monthlySummary: {
    readonly period: string | null;
    readonly totalCommission: number;
    readonly transactionCount: number;
  };
  readonly lines: ReadonlyArray<Record<string, unknown>>;
  readonly status: string;
  readonly version: number;
}

export interface RevenueReport {
  readonly metricVersion: string;
  readonly currency: "JPY";
  readonly from: string;
  readonly toExclusive: string;
  readonly generatedAt: string;
  readonly metrics: Readonly<Record<string, { readonly value: number | null }>>;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
  readonly dailyRows?: ReadonlyArray<{ readonly date: string; readonly recognizedRevenue: number }>;
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
  readonly reasonCode: string;
  readonly refundTotal?: number;
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

/**
 * What the backend actually reads when capturing a payment: `method`, and
 * `reference` for card/transfer receipts. The amount is recomputed server-side
 * from the appointment so a client can never set a price — `amount` and
 * `discount` used to be declared here and sent, and were silently dropped.
 */
export interface AdminAppointmentPaymentInput {
  readonly method: "CASH" | "PAYPAY" | "VISA";
  readonly cashTendered?: number;
  readonly amountReceived?: number;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentActualServicesInput {
  readonly serviceIds: ReadonlyArray<string>;
  readonly [field: string]: unknown;
}

export interface AdminAppointmentServiceSnapshot {
  readonly id?: string;
  readonly serviceId: string;
  readonly name?: string;
  readonly serviceName: string;
  readonly unitPrice: number;
  readonly durationMinutes: number;
  readonly sortOrder: number;
}

export interface AdminCheckoutAdjustmentInput {
  readonly manualDiscount: number;
  readonly discountReason: string;
  readonly checkoutNote?: string;
}

export interface AdminCheckoutAdjustment {
  readonly appointmentId: string;
  readonly subtotal: number;
  readonly benefitDiscount: number;
  readonly manualDiscount: number;
  readonly totalDiscount: number;
  readonly amountDue: number;
  readonly checkoutNote?: string;
  readonly discountReason: string;
  readonly currency: string;
  readonly version: number;
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
  readonly kind?: "CAPTURE" | "REFUND";
  readonly parentPaymentId?: string | null;
  readonly method: string;
  readonly amount: number;
  readonly cashTendered?: number | null;
  readonly cashChange?: number | null;
  readonly status: string;
  readonly paidAt?: string;
  readonly createdAt?: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

/**
 * Shape confirmed against the live API. The amount to collect is `amountDue`;
 * there is no `total` and no `lines`, which is what this used to declare — so
 * a reader checking `quote.total` was checking a field that never arrives.
 *
 * The endpoint also ignores its request body entirely: it echoes the totals
 * already stored on the appointment. Sending serviceIds, customItems or a
 * discount changes nothing.
 */
export interface AdminAppointmentPaymentQuote {
  readonly appointmentId: string;
  readonly subtotal: number;
  readonly discount: number;
  readonly amountDue: number;
  readonly currency: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

/**
 * Shape confirmed against the live API: allocation candidates are staff rows,
 * keyed by `id`. The previous declaration said `staffId`, so every candidate
 * read as undefined - no radio could be selected and the assign dialog could
 * never submit. There is no score or reasons field either.
 */
export interface AdminAppointmentAllocationCandidate {
  readonly id: string;
  readonly displayName: string;
  readonly branchId?: string;
  readonly serviceIds?: ReadonlyArray<string>;
  readonly active?: boolean;
  readonly [field: string]: unknown;
}

// -- Admin customer mutations ----------------------------------------------------

export interface AdminCustomerDraft {
  readonly displayName: string;
  readonly phone: string;
  readonly email?: string;
  readonly username?: string;
  readonly temporaryPassword?: string;
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
  readonly pointBalance: number;
  readonly tier: string;
  readonly coupons: ReadonlyArray<Record<string, unknown>>;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminCustomerCouponIssuanceInput {
  readonly couponId: string;
  readonly reasonCode?: string;
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

/**
 * Shape confirmed against the live API. The date field is `startsAt` and the
 * services are objects under `services`, not a `serviceNames` string array —
 * reading the old names threw on `.join` and took the whole customers page down
 * as soon as a customer had any history.
 */
export interface AdminCustomerNailHistoryService {
  readonly serviceId: string;
  readonly serviceName: string;
  readonly unitPrice: number;
  readonly durationMinutes?: number;
}

export interface AdminCustomerNailHistoryEntry {
  readonly appointmentId: string;
  readonly startsAt: string;
  readonly status?: string;
  readonly services: ReadonlyArray<AdminCustomerNailHistoryService>;
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
  readonly pointsSigned: number;
  readonly reasonCode: string;
  readonly [field: string]: unknown;
}

export interface AdminCustomerPointAdjustment {
  readonly customerId: string;
  readonly pointBalance: number;
  readonly transaction: Readonly<Record<string, unknown>>;
  readonly version: number;
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
  readonly status?: "ACTIVE" | "INACTIVE";
  /** A freshly uploaded media id to store as the profile photo; null/"" clears it, omit to keep. */
  readonly avatarMediaId?: string | null;
  readonly [field: string]: unknown;
}

export interface AdminStaffPatch {
  readonly displayName?: string;
  /** Owner only: link the profile to a login, or null to unlink it. */
  readonly accountId?: string | null;
  readonly branchId?: string;
  readonly serviceIds?: ReadonlyArray<string>;
  readonly status?: "ACTIVE" | "INACTIVE";
  /** A freshly uploaded media id to store as the profile photo; null/"" clears it, omit to keep. */
  readonly avatarMediaId?: string | null;
  readonly [field: string]: unknown;
}

export interface AdminStaffCompensationInput {
  readonly baseSalary: number;
  readonly commissionRate: number;
  /** Null clears it, so APP jobs fall back to the base rate. */
  readonly appCommissionRate?: number | null;
  /**
   * Required, `YYYY-MM-DD`. The backend parses it unconditionally and rejects
   * the whole request when it is absent, so an optional field here meant the
   * form compiled fine and failed every single time at runtime.
   */
  readonly effectiveFrom: string;
  readonly note?: string;
  readonly [field: string]: unknown;
}

/**
 * One service a staff member is cleared to perform. The identifier the backend
 * reads is `skillId`, not `serviceId` — the form used to send `serviceId`, so
 * every entry resolved to an empty id, the ids collided, and the save came back
 * "Ky nang bi trung hoac cap do khong hop le."
 */
export interface AdminStaffSkill {
  readonly skillId: string;
  /** TRAINEE | BEGINNER | JUNIOR | MID | QUALIFIED | SENIOR | EXPERT. Defaults to QUALIFIED. */
  readonly proficiencyLevel?: string;
  readonly certifiedAt?: string;
  readonly [field: string]: unknown;
}

/** `GET/PUT /admin/staff/{id}/skills` answers this shape, not the `{ items }` list envelope. */
export interface AdminStaffSkillSet {
  readonly staffId: string;
  readonly skills: ReadonlyArray<AdminStaffSkill>;
  readonly version: number;
}

export interface AdminStaffSkillsInput {
  readonly skills: ReadonlyArray<AdminStaffSkill>;
  readonly [field: string]: unknown;
}

/**
 * Shape confirmed against the live API: a shift is a branch-local date plus
 * wall-clock times, and its state is `approvalStatus`. Reading startsAt/endsAt
 * produced "Invalid Date → Invalid Date" for every row.
 */
export interface AdminStaffShift {
  readonly id: string;
  readonly staffId: string;
  readonly branchId: string;
  readonly localDate: string;
  readonly startLocalTime: string;
  readonly endLocalTime: string;
  readonly type?: "WORK" | "LEAVE";
  readonly approvalStatus?: string;
  readonly reason?: string;
  readonly [field: string]: unknown;
}

/**
 * A shift is stated in the branch's own local date and wall-clock times; the
 * backend resolves them against the branch timezone. It never read startsAt or
 * endsAt, which is what this used to declare, so every save was rejected.
 * Minutes must land on a quarter hour.
 */
export interface AdminStaffShiftDraft {
  readonly staffId: string;
  readonly localDate: string;
  readonly startLocalTime: string;
  readonly endLocalTime: string;
  readonly type?: "WORK" | "LEAVE";
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminLeaveRequest {
  readonly id: string;
  readonly requestId?: string;
  readonly staffId: string;
  readonly branchId: string;
  readonly from: string;
  readonly to: string;
  readonly reason?: string;
  readonly status: string;
  readonly decidedAt?: string;
  readonly [field: string]: unknown;
}

/** Leave is whole days in branch-local dates, and the reason is required. */
export interface AdminLeaveRequestDraft {
  readonly staffId: string;
  readonly from: string;
  readonly to: string;
  readonly reason: string;
  readonly [field: string]: unknown;
}

export interface AdminLeaveRequestDecisionInput {
  readonly decision: "APPROVE" | "REJECT";
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AdminStaffPerformanceKpi {
  readonly revenue?: number;
  readonly refundTotal?: number;
  readonly orderCount?: number;
  readonly commissionAmount?: number;
  readonly activeStaffCount?: number;
}

export interface AdminStaffPerformance {
  readonly branchId: string;
  readonly period: string;
  readonly currency?: string;
  readonly branchTimeZone?: string;
  // Verified live: { staff: { id, displayName }, workingStatus, revenue,
  // orderCount, commissionRate, commissionAmount, version }. Kept loose here
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
  readonly price: number;
  readonly durationMinutes: number;
  readonly warrantyDays?: number;
  readonly description?: string;
  readonly nameJa?: string;
  readonly status?: "ACTIVE" | "INACTIVE";
  readonly imageUrl?: string | null;
  readonly imageMediaId?: string | null;
  readonly isFeatured?: boolean;
  readonly serviceType?: "BASE" | "ADD_ON";
  readonly addonGroup?: string | null;
  readonly bookableStandalone?: boolean;
  readonly representsNoSelection?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminServiceItemPatch {
  readonly name?: string;
  readonly categoryId?: string;
  readonly price?: number;
  readonly durationMinutes?: number;
  readonly warrantyDays?: number;
  readonly description?: string;
  readonly nameJa?: string;
  readonly status?: "ACTIVE" | "INACTIVE";
  readonly imageUrl?: string | null;
  readonly imageMediaId?: string | null;
  readonly isFeatured?: boolean;
  readonly serviceType?: "BASE" | "ADD_ON";
  readonly addonGroup?: string | null;
  readonly bookableStandalone?: boolean;
  readonly representsNoSelection?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminServiceAddonBranchConfig {
  readonly branchId: string;
  readonly enabled: boolean;
  readonly priceOverride: number | null;
  readonly durationOverride: number | null;
}

export interface AdminServiceAddonRuleItem {
  readonly ruleId: string;
  readonly addonServiceId: string;
  readonly sortOrder: number;
  readonly addon: AdminServiceItem;
  readonly branches: ReadonlyArray<AdminServiceAddonBranchConfig>;
}

export interface AdminServiceAddonGroup {
  readonly code: string;
  /** Display name for the group; null until a salon names it, and the code stands in. */
  readonly nameVi?: string | null;
  readonly nameJa?: string | null;
  readonly selectionMode: "SINGLE" | "MULTIPLE";
  readonly required: boolean;
  readonly minSelections: number;
  readonly maxSelections: number;
  readonly items: ReadonlyArray<AdminServiceAddonRuleItem>;
}

export interface AdminServiceAddonConfiguration {
  readonly serviceId: string;
  readonly version: number;
  readonly groups: ReadonlyArray<AdminServiceAddonGroup>;
  readonly addonCatalog: ReadonlyArray<AdminServiceItem>;
  readonly branches: ReadonlyArray<AdminBranch>;
}

export interface AdminServiceAddonConfigurationInput {
  readonly groups: ReadonlyArray<{
    readonly code: string;
    readonly nameVi?: string;
    readonly nameJa?: string;
    readonly selectionMode: "SINGLE" | "MULTIPLE";
    readonly required: boolean;
    readonly minSelections: number;
    readonly maxSelections: number;
    readonly items: ReadonlyArray<{
      readonly addonServiceId: string;
      readonly sortOrder: number;
      readonly branches: ReadonlyArray<AdminServiceAddonBranchConfig>;
    }>;
  }>;
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

/**
 * Shape confirmed against the live API. The previous declaration used `kind`,
 * `percentage` and `active`; the backend speaks `type`, `percent` and `status`,
 * so both reading and writing a surcharge were broken.
 */
export interface AdminSurcharge {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: "FIXED" | "PERCENT";
  readonly status: "ACTIVE" | "INACTIVE";
  readonly amount?: number;
  readonly percent?: number;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminSurchargeDraft {
  /** Required by the backend; uppercase identifier such as WEEKEND. */
  readonly code: string;
  readonly name: string;
  readonly type: "FIXED" | "PERCENT";
  readonly status?: "ACTIVE" | "INACTIVE";
  readonly amount?: number;
  readonly percent?: number;
  readonly [field: string]: unknown;
}

export interface AdminSurchargePatch {
  readonly name?: string;
  readonly type?: "FIXED" | "PERCENT";
  readonly status?: "ACTIVE" | "INACTIVE";
  readonly amount?: number;
  readonly percent?: number;
  readonly [field: string]: unknown;
}

// -- Admin payments / refunds ----------------------------------------------------

export interface AdminPaymentRefund {
  readonly id: string;
  readonly appointmentId: string;
  readonly parentPaymentId: string;
  readonly kind: "REFUND";
  readonly amount: number;
  readonly method: string;
  readonly status: string;
  readonly createdAt: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminPaymentRefundInput {
  readonly amount: number;
  readonly reasonCode: string;
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
  readonly exportId: string;
  readonly reportType?: string;
  readonly status: string;
  readonly expiresAt: string;
  readonly completedAt?: string;
  readonly errorCode?: string;
  readonly [field: string]: unknown;
}

export interface AdminReportExportInput {
  readonly reportType: "REVENUE_SUMMARY" | "BRANCHES" | "CUSTOMERS" | "STAFF_PERFORMANCE" | "PAYROLL_MONTHLY" | "SALES_REPORTS_MONTHLY";
  readonly format?: "CSV" | "XLSX";
  readonly locale?: "vi" | "ja";
  readonly filters?: Readonly<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

export interface AdminReportExportDownloadInput {
  readonly ttlSeconds?: number;
  readonly [field: string]: unknown;
}

export interface AdminReportExportDownloadUrl {
  readonly exportId: string;
  readonly signedUrl: string;
  readonly expiresAt: string;
}

// -- Admin audit -----------------------------------------------------------------

export interface AdminAuditLog {
  readonly id: string;
  readonly actorId?: string;
  readonly action: string;
  /** Backend trả `resourceType`/`resourceId`, không phải `targetType`/`targetId`. */
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly outcome?: string;
  readonly createdAt: string;
  /** `branchId` nằm trong `metadata`, không có ở cấp cao nhất của bản ghi. */
  readonly metadata?: Readonly<Record<string, unknown>>;
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
  readonly status: string;
  readonly unreadCount: number;
  /** ISO time the conversation was pinned for the whole salon; null or absent when not pinned. */
  readonly pinnedAt?: string | null;
  readonly customer: AdminConversationCustomerSummary;
  readonly lastMessage?: {
    readonly id: string;
    readonly senderType: string;
    readonly content: string;
    /** "IMAGE" for a photo message, whose content may be empty. */
    readonly messageType?: string;
    readonly recalledAt?: string;
    readonly createdAt: string;
  };
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminConversationPatch {
  readonly status: "READ" | "UNREAD" | "ARCHIVED";
  readonly [field: string]: unknown;
}

export interface AdminBookingConfirmation {
  readonly appointmentId: string;
  readonly appointmentCode: string;
  readonly branchId: string;
  readonly branchName?: string;
  readonly branchAddress?: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly serviceName: string;
  readonly optionNames: ReadonlyArray<string>;
  readonly staffName: string;
  readonly startAt: string;
  readonly durationMinutes: number;
  readonly totalJpy: number;
  readonly branchTimeZone: string;
  readonly note: string;
  readonly expectedPaymentMethod?: "CASH" | "PAYPAY" | "VISA" | null;
}

export interface AdminAppointmentCancellationNotice {
  readonly appointmentId: string;
  readonly appointmentCode: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly branchAddress: string;
  readonly serviceName: string;
  readonly optionNames: ReadonlyArray<string>;
  readonly startAt: string;
  readonly branchTimeZone: string;
  readonly cancelledBy: "CUSTOMER" | "SALON";
  readonly cancelledAt: string;
  readonly reasonCode: string;
}

export interface AdminPaymentRecordedNotice {
  readonly appointmentId: string;
  readonly paymentId: string;
  readonly branchId: string;
  readonly amountJpy: number;
  readonly method: "CASH" | "PAYPAY" | "VISA" | "NO_CHARGE";
  readonly recordedAt: string;
}

export interface AdminWarrantyNotice {
  readonly warrantyId: string;
  readonly appointmentId: string;
  readonly branchId: string;
  readonly serviceId: string;
  readonly serviceName: string;
  readonly warrantyDays: number;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly locale: "vi" | "ja";
}

export interface AdminMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderType: string;
  readonly content: string;
  readonly messageType?: string;
  readonly booking?: AdminBookingConfirmation | null;
  readonly warranty?: AdminWarrantyNotice | null;
  readonly cancellation?: AdminAppointmentCancellationNotice | null;
  readonly payment?: AdminPaymentRecordedNotice | null;
  /** Photos of an IMAGE message; `url` is a signed link that expires after about an hour. */
  readonly images?: ReadonlyArray<AdminChatImage>;
  /** Set when the sender recalled the message; its content and photos are gone. */
  readonly recalledAt?: string;
  readonly createdAt: string;
  readonly deliveryStatus?: string;
  readonly [field: string]: unknown;
}

export interface AdminChatImage {
  readonly mediaId: string;
  readonly url?: string;
}

export interface AdminMessageDraft {
  /** May be empty when the message carries photos. */
  readonly content: string;
  /** Uploaded media ids to attach (at most 4). */
  readonly imageMediaIds?: ReadonlyArray<string>;
  readonly [field: string]: unknown;
}

// -- Admin reviews ---------------------------------------------------------------

/**
 * Verified against GET /admin/branches/{branchId}/reviews on the live API.
 * The previous declaration named `rating`, `content`, `handling.status` and
 * `reply.content`; none of those exist, so the reviews table rendered four
 * empty columns while TypeScript reported no problem.
 */
export interface AdminReview {
  readonly id: string;
  readonly appointmentId: string;
  readonly customerId: string;
  readonly rating: number;
  readonly comment: string;
  readonly managerReply?: string | null;
  readonly handlingStatus: string;
  readonly source: "CUSTOMER_APP" | "COUNTER";
  readonly publicationStatus: "PENDING" | "PUBLISHED" | "HIDDEN";
  readonly customer?: { readonly id: string; readonly displayName: string; readonly avatarUrl?: string | null };
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly version: number;
}

export interface AdminAppointmentPaymentCapture {
  readonly appointment: AdminAppointment;
  readonly payment: AdminAppointmentPayment;
  readonly pointsEarned: number;
  readonly pointBalance: number;
}

export interface AdminReviewInput {
  readonly rating: number;
  readonly comment: string;
}

export interface AdminReviewPublicationPatch {
  readonly status: "PUBLISHED" | "HIDDEN";
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
  readonly salon?: AdminSalonSettings;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminBranchSettingsPatch {
  readonly booking?: Readonly<Record<string, unknown>>;
  readonly payment?: Readonly<Record<string, unknown>>;
  readonly automation?: Readonly<Record<string, unknown>>;
  readonly notification?: Readonly<Record<string, unknown>>;
  readonly backup?: Readonly<Record<string, unknown>>;
  readonly salon?: AdminSalonSettings;
  readonly [field: string]: unknown;
}

export type AdminSalonAmenity = "WIFI" | "REFRESHMENTS" | "PHONE_CHARGING" | "LUGGAGE_STORAGE";
export type AdminSalonPaymentMethod = "CASH" | "PAYPAY" | "VISA" | "MASTERCARD";

export interface AdminSalonSettings {
  readonly openingHours: {
    readonly openTime: string;
    readonly closeTime: string;
    readonly lastBookingTime: string;
  };
  readonly amenities: ReadonlyArray<AdminSalonAmenity>;
  readonly paymentMethods: ReadonlyArray<AdminSalonPaymentMethod>;
}

// -- Admin promotions ------------------------------------------------------------

/**
 * Shape confirmed against the live API: the name is `title` (mirrored to
 * `nameVi`), the discount is one `value` alongside `type`, and the window is
 * `startAt`/`endAt`. The previous declaration used name/kind/percentage/
 * startsAt/endsAt, none of which the endpoint reads or returns.
 */
export interface AdminPromotion {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly nameVi?: string;
  readonly type: string;
  readonly value: number;
  readonly status: string;
  readonly startAt?: string;
  readonly endAt?: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminPromotionDraft {
  /** A-Z, 0-9, underscore and hyphen only, 3-60 characters. */
  readonly code: string;
  readonly title: string;
  readonly type: string;
  readonly value: number;
  /** Both dates are required on create. */
  readonly startAt: string;
  readonly endAt: string;
  readonly issuanceLimit: number;
  readonly [field: string]: unknown;
}

export interface AdminPromotionPatch {
  readonly title?: string;
  readonly status?: string;
  readonly type?: string;
  readonly value?: number;
  readonly startAt?: string;
  readonly endAt?: string;
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
  readonly campaignId: string;
  readonly title?: string;
  readonly channel?: string;
  readonly status: string;
  readonly scheduledAt?: string;
  readonly estimatedRecipients?: number;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminNotificationCampaignDraft {
  readonly title: string;
  readonly channel: string;
  readonly message: string;
  readonly branchIds?: ReadonlyArray<string>;
  readonly minimumPoints?: number;
  readonly scheduledAt?: string;
  readonly [field: string]: unknown;
}

export interface AdminNotificationCampaignMetrics {
  readonly campaignId: string;
  readonly status: string;
  readonly estimatedRecipients: number;
  readonly sentCount: number;
  readonly deliveredCount: number;
  readonly failedCount: number;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminAudiencePreviewInput {
  readonly branchIds?: ReadonlyArray<string>;
  readonly minimumPoints?: number;
  readonly sampleLimit?: number;
  readonly [field: string]: unknown;
}

export interface AdminAudiencePreview {
  readonly estimatedRecipients: number;
  readonly sample?: ReadonlyArray<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

// -- Admin nail designs ----------------------------------------------------------

/**
 * Shape confirmed against the live API. The name field is `title` (mirrored to
 * `nameVi`), not `name`, and there is no `imageUrl` — media is referenced by
 * `mediaIds`. Publishing requires `consentToPublish`.
 */
export interface AdminNailDesign {
  readonly id: string;
  readonly title: string;
  readonly nameVi?: string;
  readonly mediaIds?: ReadonlyArray<string>;
  /** Stable public URLs for the photos, derived by the API from mediaIds; the first is the cover. */
  readonly images?: ReadonlyArray<string>;
  readonly thumbnailUrl?: string | null;
  /** Optional whole-yen reference price shown with the design; it is not a booking quote. */
  readonly indicativePrice?: number | null;
  readonly tags?: ReadonlyArray<string>;
  readonly visibility?: string;
  readonly consentToPublish?: boolean;
  readonly status: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminNailDesignDraft {
  readonly title: string;
  readonly indicativePrice?: number | null;
  readonly mediaIds?: ReadonlyArray<string>;
  readonly status?: string;
  /** Required by the backend before a design may be PUBLISHED. */
  readonly consentToPublish?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminNailDesignPatch {
  readonly title?: string;
  readonly indicativePrice?: number | null;
  readonly mediaIds?: ReadonlyArray<string>;
  readonly status?: string;
  readonly consentToPublish?: boolean;
  readonly [field: string]: unknown;
}

export interface AdminNailDesignProposalDecisionInput {
  readonly decision: "APPROVE" | "REJECT";
  readonly reason?: string;
  readonly [field: string]: unknown;
}

export interface AdminNailDesignProposal {
  readonly proposalId: string;
  readonly status: string;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly decidedAt?: string;
  readonly note?: string;
  readonly version: number;
  readonly [field: string]: unknown;
}

// -- Admin foundation: branches CRUD + accounts + configs + resolutions --------

export interface AdminBranch {
  readonly id: string;
  readonly name: string;
  readonly address?: string;
  /** Backend trả về cờ boolean `active`, không phải chuỗi `status`. */
  readonly active?: boolean;
  readonly timezone?: string;
  /** Public media URL of the branch photo; null when none is set. */
  readonly imageUrl?: string | null;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AdminBranchDraft {
  readonly name: string;
  readonly address: string;
  readonly timezone?: string;
  /** Uploaded media id to publish as the branch photo. */
  readonly imageMediaId?: string | null;
  readonly [field: string]: unknown;
}

export interface AdminBranchPatch {
  readonly name?: string;
  readonly address?: string;
  readonly status?: "ACTIVE" | "INACTIVE";
  readonly timeZone?: string;
  /** Omitted keeps the photo, null clears it, an uploaded media id replaces it. */
  readonly imageMediaId?: string | null;
  readonly [field: string]: unknown;
}

export interface AdminAccount {
  readonly id: string;
  readonly phone: string;
  readonly displayName: string;
  readonly role: string;
  readonly branchIds?: ReadonlyArray<string>;
  /** Public media URL of the account photo; null when none is set. */
  readonly avatarUrl?: string | null;
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
  readonly temporaryPassword?: string;
  /** A freshly uploaded media id to store as the account photo; null/"" clears it, omit to keep. */
  readonly avatarMediaId?: string | null;
  readonly [field: string]: unknown;
}

export interface AdminAccountPatch {
  readonly displayName?: string;
  readonly role?: string;
  readonly branchIds?: ReadonlyArray<string>;
  readonly status?: string;
  /** A freshly uploaded media id to store as the account photo; null/"" clears it, omit to keep. */
  readonly avatarMediaId?: string | null;
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

/**
 * Shape confirmed against the live API. There is no `rules` key; the earn rate,
 * redemption cap and increment are top-level and the backend rejects a save
 * that omits any of them, because a PUT replaces the record rather than merging
 * into it.
 */
export interface AdminLoyaltyConfig {
  readonly version: number;
  readonly pointRate?: { readonly spend: number; readonly points: number };
  readonly tiers?: ReadonlyArray<Record<string, unknown>>;
  readonly redemptionCapPercent?: number;
  readonly redemptionIncrement?: number;
  readonly [field: string]: unknown;
}

/** One slide of the customer app's home carousel. */
export interface AdminHomeBanner {
  readonly id: string;
  readonly mediaId: string;
  /** Stable public URL derived by the API from mediaId. */
  readonly imageUrl: string;
  readonly title: string | null;
  /** An https URL or an in-app path; null when the slide is not tappable. */
  readonly link: string | null;
  readonly sortOrder: number;
  readonly active: boolean;
}

export interface AdminHomeBanners {
  readonly items: ReadonlyArray<AdminHomeBanner>;
  readonly version: number;
  readonly updatedAt: string | null;
}

/** What the console sends: order is the array order, ids and urls are the API's to assign. */
export interface AdminHomeBannerInput {
  readonly mediaId: string;
  readonly title?: string | null;
  readonly link?: string | null;
  readonly active?: boolean;
}

export interface AdminHomeAnnouncement {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly branchIds: ReadonlyArray<string>;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly sortOrder: number;
  readonly active: boolean;
}

/** Salon news on the customer app's home strip; order is the array order. */
export interface AdminHomeAnnouncements {
  readonly items: ReadonlyArray<AdminHomeAnnouncement>;
  readonly version: number;
  readonly updatedAt: string | null;
}

export interface AdminHomeAnnouncementInput {
  readonly id?: string;
  readonly title: string;
  readonly message: string;
  readonly branchIds: ReadonlyArray<string>;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly active: boolean;
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

// ---------------------------------------------------------------------------
// Sales reports and payroll (platform docs/payroll-sales-reports.md)
// ---------------------------------------------------------------------------

export type AdminSalesPlatform = "NAILIE_NEW" | "NAILIE_RETURNING" | "MINIMO" | "HOT_PEPPER" | "APP";
export type AdminSalesReportStatus = "PENDING" | "APPROVED" | "REJECTED";

/** One customer's job as reported; every money figure is what the API stored at report time. */
export interface AdminSalesReport {
  readonly id: string;
  readonly branchId: string;
  readonly staffId: string;
  readonly reportedByAccountId: string | null;
  /** YYYY-MM-DD in the branch's zone. */
  readonly reportDate: string;
  readonly servedAt: string | null;
  readonly platform: AdminSalesPlatform;
  readonly coursePrice: number;
  readonly accessoryAmount: number;
  readonly grossAmount: number;
  readonly platformFee: number;
  readonly staffFeeShare: number;
  readonly salonFeeShare: number;
  readonly staffRatePercent: number;
  readonly staffAmount: number;
  readonly salonAmount: number;
  readonly paymentMethod: string;
  readonly note: string;
  readonly status: AdminSalesReportStatus;
  readonly rejectionReason: string | null;
  readonly decidedBy: string | null;
  readonly decidedAt: string | null;
  readonly appointmentId: string | null;
  readonly paymentId: string | null;
  /** Automatic, read-only reversal of the referenced sales report. */
  readonly refundOfReportId?: string | null;
  readonly payrollPeriodId: string | null;
  /** True once the month was paid out; the API refuses every change until the owner unlocks it. */
  readonly locked: boolean;
  readonly version: number;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface AdminSalesReportInput {
  /** Managers and the owner name the technician; a technician's own login reports for itself. */
  readonly staffId?: string;
  readonly reportDate?: string;
  readonly servedAt?: string | null;
  readonly platform: AdminSalesPlatform;
  readonly coursePrice: number;
  readonly accessoryAmount?: number;
  readonly paymentMethod: string;
  readonly note?: string;
}

export type AdminSalesReportPatch = Partial<Omit<AdminSalesReportInput, "staffId">>;

export interface AdminSalesReportPreview {
  readonly staffId: string;
  readonly reportDate: string;
  readonly platform: AdminSalesPlatform;
  readonly grossAmount: number;
  readonly platformFee: number;
  readonly staffFeeShare: number;
  readonly salonFeeShare: number;
  readonly staffRatePercent: number;
  readonly staffAmount: number;
  readonly salonAmount: number;
}

export type AdminSalesReportDecision = "APPROVE" | "REJECT" | "PENDING";

export interface AdminSalesReportDecisionInput {
  readonly decision: AdminSalesReportDecision;
  /** Required when rejecting. */
  readonly reason?: string;
}

/** Either the named reports, or every pending report of a branch on a day. */
export interface AdminSalesReportsBatchDecisionInput extends AdminSalesReportDecisionInput {
  readonly reportIds?: ReadonlyArray<string>;
  readonly branchId?: string;
  readonly date?: string;
}

export interface AdminSalesReportsBatchDecisionResult {
  readonly decided: number;
  readonly skipped: ReadonlyArray<{ readonly id: string; readonly reason: string }>;
}

export type AdminPayrollStatus = "OPEN" | "PAID" | "UNLOCKED";

export interface AdminPayrollRow {
  readonly staffId: string;
  readonly displayName: string;
  readonly active: boolean;
  readonly approvedCount: number;
  readonly grossTotal: number;
  readonly feeTotal: number;
  readonly staffTotal: number;
  readonly salonTotal: number;
  readonly baseSalary: number;
  readonly payable: number;
  readonly status: AdminPayrollStatus;
  readonly periodId: string | null;
  readonly paidAt: string | null;
  readonly paidBy: string | null;
  readonly unlockedAt: string | null;
  readonly periodVersion: number | null;
}

export interface AdminPayrollTotals {
  readonly approvedCount: number;
  readonly grossTotal: number;
  readonly feeTotal: number;
  readonly staffTotal: number;
  readonly salonTotal: number;
  readonly baseSalary: number;
  readonly payable: number;
}

export interface AdminPayrollSheet {
  readonly branchId: string;
  readonly period: string;
  readonly from: string;
  readonly toExclusive: string;
  readonly rows: ReadonlyArray<AdminPayrollRow>;
  readonly totals: AdminPayrollTotals;
}

export interface AdminMyPayroll extends AdminPayrollRow {
  readonly branchId: string;
  readonly period: string;
}

/** Logins per role and the grants the role's template carries (from GET /admin/accounts/roles). */
export interface AdminAccountRoleSummary {
  readonly role: string;
  readonly accountCount: number;
  readonly activeCount: number;
  readonly permissions: ReadonlyArray<string>;
}

export interface AdminAccountRoles {
  readonly roles: ReadonlyArray<AdminAccountRoleSummary>;
}

export interface AdminPayrollUnlockResult {
  readonly branchId: string;
  readonly staffId: string;
  readonly period: string;
  readonly status: "UNLOCKED";
  readonly unlockedAt: string;
  readonly unlockedBy: string;
  readonly version: number;
}
