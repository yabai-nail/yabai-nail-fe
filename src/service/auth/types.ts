export type AdminRole = "STAFF" | "MANAGER" | "OWNER";

export interface AdminLoginInput {
  readonly phone: string;
  readonly password: string;
}

export interface AuthenticatedAdmin {
  readonly id: string;
  readonly displayName: string;
  readonly phone: string;
  readonly role: AdminRole;
  readonly locale: string;
  readonly branchIds: string[];
}

export interface AdminSession {
  readonly sessionId: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly user: AuthenticatedAdmin;
}

// -- Customer OTP + recovery + social + refresh + merge -------------------------

export interface PhoneChallengeInput {
  readonly phone: string;
  readonly locale?: string;
  readonly [field: string]: unknown;
}

export interface PhoneChallenge {
  readonly challengeId: string;
  readonly maskedPhone: string;
  readonly expiresAt: string;
  readonly resendAllowedAt?: string;
  readonly remainingSends?: number;
  readonly [field: string]: unknown;
}

export interface PhoneChallengeVerifyInput {
  readonly code: string;
  readonly [field: string]: unknown;
}

/**
 * The customer the backend echoes back on OTP verify and on session refresh.
 * Optional on `CustomerSession` because the field is not part of the frozen
 * contract — the nav falls back to the masked phone when it is absent.
 */
export interface AuthenticatedCustomer {
  readonly id: string;
  readonly displayName: string;
  readonly phone: string;
  readonly locale?: string;
  readonly [field: string]: unknown;
}

export interface CustomerSession {
  readonly sessionId: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly profileCompletionRequired?: boolean;
  readonly user?: AuthenticatedCustomer;
  readonly [field: string]: unknown;
}

export interface SessionRefreshInput {
  readonly refreshToken: string;
  readonly [field: string]: unknown;
}

export interface SocialAuthorizationInput {
  readonly redirectUri: string;
  readonly state?: string;
  readonly [field: string]: unknown;
}

export interface SocialAuthorization {
  readonly authorizationUrl: string;
  readonly state: string;
  readonly [field: string]: unknown;
}

export interface SocialCallbackInput {
  readonly code: string;
  readonly state?: string;
  readonly codeVerifier?: string;
  readonly [field: string]: unknown;
}

export interface AccountMergeInput {
  readonly primaryAccountId: string;
  readonly secondaryAccountId: string;
  readonly reason?: string;
  readonly [field: string]: unknown;
}

export interface AccountMergeResult {
  readonly mergedAccountId: string;
  readonly [field: string]: unknown;
}

// -- Admin auth mutations + bootstrap ------------------------------------------

/**
 * `GET /admin/auth/session` returns the phone masked and never returns tokens —
 * it is the reload bootstrap, not a login response. Kept separate from
 * `AuthenticatedAdmin` so the two shapes cannot be confused at a call site.
 */
export interface AdminSessionUser {
  readonly id: string;
  readonly displayName: string;
  readonly phoneMasked: string;
  readonly role: AdminRole;
  readonly locale: string;
  readonly branchIds: string[];
  readonly permissions: string[];
  readonly capabilities: string[];
}

export interface AdminSessionSummary {
  readonly user: AdminSessionUser;
  readonly session: {
    readonly id: string | null;
    readonly expiresAt: string | null;
    readonly activeBranchId: string | null;
  };
}

export interface AdminSessionBranchInput {
  readonly branchId: string;
  readonly [field: string]: unknown;
}

/** Branch switch mints a new access token carrying the selected branch. */
export interface AdminBranchSwitchResult {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly selectedBranchId: string;
}

export interface AdminPasswordChangeInput {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly [field: string]: unknown;
}

export interface AdminPasswordResetRequestInput {
  readonly phone: string;
  readonly [field: string]: unknown;
}

export interface AdminPasswordResetInput {
  readonly resetToken: string;
  readonly newPassword: string;
  readonly [field: string]: unknown;
}
