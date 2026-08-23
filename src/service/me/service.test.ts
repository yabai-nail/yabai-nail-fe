import { describe, expect, it } from "vitest";

import { getApiOperation } from "../api";
import { meService } from "./service";

const ME_OPERATION_IDS = [
  "GET /api/v1/me",
  "PATCH /api/v1/me",
  "POST /api/v1/me/account-deletion-requests",
  "GET /api/v1/me/coupons",
  "POST /api/v1/me/coupons/{couponId}/claims",
  "PUT /api/v1/me/devices/{installationId}",
  "DELETE /api/v1/me/devices/{installationId}",
  "GET /api/v1/me/favorite-designs",
  "PUT /api/v1/me/favorite-designs/{designId}",
  "DELETE /api/v1/me/favorite-designs/{designId}",
  "GET /api/v1/me/membership-card",
  "GET /api/v1/me/membership-progress",
  "GET /api/v1/me/notifications",
  "PATCH /api/v1/me/notifications/{notificationId}",
  "POST /api/v1/me/notifications/read-all",
  "GET /api/v1/me/point-transactions",
  "PATCH /api/v1/me/preferences/default-branch",
  "PATCH /api/v1/me/preferences/language",
] as const;

describe("meService", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of ME_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each /me operation", () => {
    for (const fn of [
      meService.profile,
      meService.updateProfile,
      meService.requestAccountDeletion,
      meService.coupons,
      meService.claimCoupon,
      meService.registerDevice,
      meService.unregisterDevice,
      meService.favoriteDesigns,
      meService.addFavoriteDesign,
      meService.removeFavoriteDesign,
      meService.membershipCard,
      meService.membershipProgress,
      meService.notifications,
      meService.updateNotification,
      meService.markAllNotificationsRead,
      meService.pointTransactions,
      meService.setDefaultBranch,
      meService.setLanguage,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});
