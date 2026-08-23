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

export interface CustomerSession {
  readonly sessionId: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly profileCompletionRequired?: boolean;
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
