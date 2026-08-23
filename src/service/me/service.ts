import { executeApiOperation } from "../api";
import type { BackendList } from "../admin/types";
import type {
  MeAccountDeletionInput,
  MeAccountDeletionRequest,
  MeCoupon,
  MeCouponClaim,
  MeCouponClaimInput,
  MeDefaultBranchInput,
  MeDevice,
  MeDeviceInput,
  MeFavoriteDesign,
  MeLanguageInput,
  MeMembershipCard,
  MeMembershipProgress,
  MeNotification,
  MeNotificationPatch,
  MePointTransaction,
  MeProfile,
  MeProfilePatch,
} from "./types";

export const meService = {
  profile: () => executeApiOperation<MeProfile>("GET /api/v1/me"),
  updateProfile: (patch: MeProfilePatch, version?: string | number) =>
    executeApiOperation<MeProfile>("PATCH /api/v1/me", { body: patch, version }),
  requestAccountDeletion: (input?: MeAccountDeletionInput, idempotencyKey?: string) =>
    executeApiOperation<MeAccountDeletionRequest>(
      "POST /api/v1/me/account-deletion-requests",
      { body: input ?? {}, idempotencyKey },
    ),
  coupons: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<MeCoupon>>("GET /api/v1/me/coupons", { query }),
  claimCoupon: (couponId: string, input?: MeCouponClaimInput, idempotencyKey?: string) =>
    executeApiOperation<MeCouponClaim>("POST /api/v1/me/coupons/{couponId}/claims", {
      path: { couponId },
      body: input ?? {},
      idempotencyKey,
    }),
  registerDevice: (installationId: string, input: MeDeviceInput) =>
    executeApiOperation<MeDevice>("PUT /api/v1/me/devices/{installationId}", {
      path: { installationId },
      body: input,
    }),
  unregisterDevice: (installationId: string) =>
    executeApiOperation<void>("DELETE /api/v1/me/devices/{installationId}", {
      path: { installationId },
    }),
  favoriteDesigns: () =>
    executeApiOperation<BackendList<MeFavoriteDesign>>("GET /api/v1/me/favorite-designs"),
  addFavoriteDesign: (designId: string) =>
    executeApiOperation<MeFavoriteDesign>("PUT /api/v1/me/favorite-designs/{designId}", {
      path: { designId },
      body: {},
    }),
  removeFavoriteDesign: (designId: string) =>
    executeApiOperation<void>("DELETE /api/v1/me/favorite-designs/{designId}", {
      path: { designId },
    }),
  membershipCard: () =>
    executeApiOperation<MeMembershipCard>("GET /api/v1/me/membership-card"),
  membershipProgress: () =>
    executeApiOperation<MeMembershipProgress>("GET /api/v1/me/membership-progress"),
  notifications: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<MeNotification>>("GET /api/v1/me/notifications", { query }),
  updateNotification: (
    notificationId: string,
    patch: MeNotificationPatch,
    version?: string | number,
  ) =>
    executeApiOperation<MeNotification>(
      "PATCH /api/v1/me/notifications/{notificationId}",
      { path: { notificationId }, body: patch, version },
    ),
  markAllNotificationsRead: (idempotencyKey?: string) =>
    executeApiOperation<{ updated: number }>("POST /api/v1/me/notifications/read-all", {
      body: {},
      idempotencyKey,
    }),
  pointTransactions: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<MePointTransaction>>(
      "GET /api/v1/me/point-transactions",
      { query },
    ),
  setDefaultBranch: (input: MeDefaultBranchInput, version?: string | number) =>
    executeApiOperation<MeProfile>("PATCH /api/v1/me/preferences/default-branch", {
      body: input,
      version,
    }),
  setLanguage: (input: MeLanguageInput, version?: string | number) =>
    executeApiOperation<MeProfile>("PATCH /api/v1/me/preferences/language", {
      body: input,
      version,
    }),
};
