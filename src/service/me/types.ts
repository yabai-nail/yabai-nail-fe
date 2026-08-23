// Customer self-service types: profile, preferences, loyalty stack,
// notifications, device registration and account deletion.

export interface MeProfile {
  readonly id: string;
  readonly phone: string;
  readonly displayName?: string;
  readonly locale?: string;
  readonly defaultBranchId?: string;
  readonly membershipTier?: string;
  readonly points?: number;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface MeProfilePatch {
  readonly displayName?: string;
  readonly locale?: string;
  readonly [field: string]: unknown;
}

export interface MeAccountDeletionInput {
  readonly reason?: string;
  readonly [field: string]: unknown;
}

export interface MeAccountDeletionRequest {
  readonly id: string;
  readonly requestedAt: string;
  readonly effectiveAt?: string;
  readonly status: string;
  readonly [field: string]: unknown;
}

export interface MeCoupon {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description?: string;
  readonly status: string;
  readonly claimedAt?: string;
  readonly expiresAt?: string;
  readonly [field: string]: unknown;
}

export interface MeCouponClaimInput {
  readonly branchId?: string;
  readonly [field: string]: unknown;
}

export interface MeCouponClaim {
  readonly couponId: string;
  readonly claimedAt: string;
  readonly [field: string]: unknown;
}

export interface MeDeviceInput {
  readonly platform: string;
  readonly appVersion?: string;
  readonly pushToken?: string;
  readonly locale?: string;
  readonly [field: string]: unknown;
}

export interface MeDevice {
  readonly installationId: string;
  readonly platform: string;
  readonly registeredAt: string;
  readonly [field: string]: unknown;
}

export interface MeFavoriteDesign {
  readonly designId: string;
  readonly savedAt: string;
  readonly [field: string]: unknown;
}

export interface MeMembershipCard {
  readonly customerId: string;
  readonly tier: string;
  readonly code: string;
  readonly qrToken?: string;
  readonly [field: string]: unknown;
}

export interface MeMembershipProgress {
  readonly currentTier: string;
  readonly nextTier?: string;
  readonly progressPct: number;
  readonly currentPoints: number;
  readonly pointsToNextTier?: number;
  readonly [field: string]: unknown;
}

export interface MeNotification {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly body?: string;
  readonly createdAt: string;
  readonly readAt?: string | null;
  readonly [field: string]: unknown;
}

export interface MeNotificationPatch {
  readonly readAt?: string | null;
  readonly [field: string]: unknown;
}

export interface MePointTransaction {
  readonly id: string;
  readonly deltaPoints: number;
  readonly balanceAfter?: number;
  readonly reason: string;
  readonly createdAt: string;
  readonly appointmentId?: string;
  readonly [field: string]: unknown;
}

export interface MeDefaultBranchInput {
  readonly branchId: string;
  readonly [field: string]: unknown;
}

export interface MeLanguageInput {
  readonly language: string;
  readonly [field: string]: unknown;
}
