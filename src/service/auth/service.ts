import {
  executeApiOperation,
  setAdminAccessToken,
  setCustomerAccessToken,
} from "../api";
import type {
  AccountMergeInput,
  AccountMergeResult,
  AdminBranchSwitchResult,
  AdminLoginInput,
  AdminPasswordChangeInput,
  AdminPasswordResetInput,
  AdminPasswordResetRequestInput,
  AdminSession,
  AdminSessionBranchInput,
  AdminSessionSummary,
  CustomerSession,
  PhoneChallenge,
  PhoneChallengeInput,
  PhoneChallengeVerifyInput,
  SessionRefreshInput,
  SocialAuthorization,
  SocialAuthorizationInput,
  SocialCallbackInput,
} from "./types";

export const authService = {
  async loginAdmin(input: AdminLoginInput, idempotencyKey?: string): Promise<AdminSession> {
    // Uses the canonical operation catalog so admin login shares the same
    // `executeApiOperation` code path (auto `Idempotency-Key`, typed response,
    // catalog drift caught by tests) as every other admin mutation.
    const session = await executeApiOperation<AdminSession>(
      "POST /api/v1/admin/auth/sessions",
      {
        body: {
          phone: input.phone.replace(/\s/g, ""),
          password: input.password,
        },
        idempotencyKey,
      },
    );

    setAdminAccessToken(session.accessToken);
    return session;
  },
  adminSession: () =>
    // Bootstrap the current admin session (permissions, active branch) after
    // reload. Feature-stability endpoint per the platform catalog.
    executeApiOperation<AdminSessionSummary>("GET /api/v1/admin/auth/session"),
  /**
   * Restores an admin session after reload. The refresh token rotates on every
   * call — the caller MUST persist the one that comes back or the next reload
   * replays a revoked token and the backend kills the whole family.
   */
  async refreshAdminSession(
    refreshToken: string,
    idempotencyKey?: string,
  ): Promise<AdminSession> {
    const session = await executeApiOperation<AdminSession>(
      "POST /api/v1/auth/sessions/refresh",
      { body: { refreshToken }, idempotencyKey },
    );
    setAdminAccessToken(session.accessToken);
    return session;
  },
  async switchAdminBranch(
    sessionId: string,
    input: AdminSessionBranchInput,
    idempotencyKey?: string,
  ): Promise<AdminBranchSwitchResult> {
    // The response is a fresh access token carrying `selectedBranchId`, not a
    // whole session. Install it or every later request still reads the old
    // branch.
    const result = await executeApiOperation<AdminBranchSwitchResult>(
      "POST /api/v1/admin/auth/sessions/{sessionId}/branch",
      { path: { sessionId }, body: input, idempotencyKey },
    );
    setAdminAccessToken(result.accessToken);
    return result;
  },
  changeAdminPassword: (input: AdminPasswordChangeInput, idempotencyKey?: string) =>
    executeApiOperation<void>("POST /api/v1/admin/auth/password-changes", {
      body: input,
      idempotencyKey,
    }),
  requestAdminPasswordReset: (
    input: AdminPasswordResetRequestInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<void>("POST /api/v1/admin/auth/password-reset-requests", {
      body: input,
      idempotencyKey,
    }),
  resetAdminPassword: (input: AdminPasswordResetInput, idempotencyKey?: string) =>
    executeApiOperation<AdminSession>("POST /api/v1/admin/auth/password-resets", {
      body: input,
      idempotencyKey,
    }),
  startPhoneChallenge: (input: PhoneChallengeInput, idempotencyKey?: string) =>
    executeApiOperation<PhoneChallenge>("POST /api/v1/auth/phone/challenges", {
      body: { ...input, phone: input.phone.replace(/\s/g, "") },
      idempotencyKey,
    }),
  /**
   * Verifying the OTP is the customer's login. The access token lands in the
   * customer bearer slot, never the admin one — the axios interceptor picks a
   * slot by URL, so a customer token in the admin slot would be sent on
   * `/admin/*` requests.
   */
  async verifyPhoneChallenge(
    challengeId: string,
    input: PhoneChallengeVerifyInput,
    idempotencyKey?: string,
  ): Promise<CustomerSession> {
    const session = await executeApiOperation<CustomerSession>(
      "POST /api/v1/auth/phone/challenges/{challengeId}/verify",
      { path: { challengeId }, body: input, idempotencyKey },
    );
    setCustomerAccessToken(session.accessToken);
    return session;
  },
  startRecoveryChallenge: (input: PhoneChallengeInput, idempotencyKey?: string) =>
    executeApiOperation<PhoneChallenge>("POST /api/v1/auth/recovery/phone/challenges", {
      body: input,
      idempotencyKey,
    }),
  verifyRecoveryChallenge: (
    challengeId: string,
    input: PhoneChallengeVerifyInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<CustomerSession>(
      "POST /api/v1/auth/recovery/phone/challenges/{challengeId}/verify",
      { path: { challengeId }, body: input, idempotencyKey },
    ),
  /**
   * Restores a customer session after reload. Like the admin twin, the refresh
   * token ROTATES on every call — the caller MUST persist the one that comes
   * back or the next reload replays a spent token and the backend kills the
   * whole family.
   */
  async refreshSession(
    input: SessionRefreshInput,
    idempotencyKey?: string,
  ): Promise<CustomerSession> {
    const session = await executeApiOperation<CustomerSession>(
      "POST /api/v1/auth/sessions/refresh",
      { body: input, idempotencyKey },
    );
    setCustomerAccessToken(session.accessToken);
    return session;
  },
  revokeAllSessions: () => executeApiOperation<void>("DELETE /api/v1/auth/sessions"),
  revokeCurrentSession: () => executeApiOperation<void>("DELETE /api/v1/auth/sessions/current"),
  startSocialAuthorization: (
    provider: string,
    input: SocialAuthorizationInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<SocialAuthorization>(
      "POST /api/v1/auth/social/{provider}/authorization",
      { path: { provider }, body: input, idempotencyKey },
    ),
  handleSocialCallback: (
    provider: string,
    input: SocialCallbackInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<CustomerSession>(
      "POST /api/v1/auth/social/{provider}/callback",
      { path: { provider }, body: input, idempotencyKey },
    ),
  requestAccountMerge: (input: AccountMergeInput, idempotencyKey?: string) =>
    executeApiOperation<AccountMergeResult>("POST /api/v1/auth/account-merges", {
      body: input,
      idempotencyKey,
    }),
};
