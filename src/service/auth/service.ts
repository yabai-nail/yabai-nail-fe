import { apiRequest, apiRoutes, executeApiOperation, setAccessToken } from "../api";
import type {
  AccountMergeInput,
  AccountMergeResult,
  AdminLoginInput,
  AdminSession,
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
  async loginAdmin(input: AdminLoginInput): Promise<AdminSession> {
    const session = await apiRequest<AdminSession>({
      method: "POST",
      url: apiRoutes.auth.adminSession,
      headers: { "Idempotency-Key": crypto.randomUUID() },
      data: {
        phone: input.phone.replace(/\s/g, ""),
        password: input.password,
      },
    });

    setAccessToken(session.accessToken);
    return session;
  },
  startPhoneChallenge: (input: PhoneChallengeInput, idempotencyKey?: string) =>
    executeApiOperation<PhoneChallenge>("POST /api/v1/auth/phone/challenges", {
      body: input,
      idempotencyKey,
    }),
  verifyPhoneChallenge: (
    challengeId: string,
    input: PhoneChallengeVerifyInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<CustomerSession>(
      "POST /api/v1/auth/phone/challenges/{challengeId}/verify",
      { path: { challengeId }, body: input, idempotencyKey },
    ),
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
  refreshSession: (input: SessionRefreshInput, idempotencyKey?: string) =>
    executeApiOperation<CustomerSession>("POST /api/v1/auth/sessions/refresh", {
      body: input,
      idempotencyKey,
    }),
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
