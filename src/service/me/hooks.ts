"use client";

import { useApiOperation } from "../api";
import type { BackendList } from "../admin/types";
import type {
  MeCoupon,
  MeFavoriteDesign,
  MeMembershipCard,
  MeMembershipProgress,
  MeNotification,
  MePointTransaction,
  MeProfile,
} from "./types";

export function useMeProfile() {
  return useApiOperation<MeProfile>("GET /api/v1/me");
}

export function useMeCoupons(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<MeCoupon>>("GET /api/v1/me/coupons", { query });
}

export function useMeFavoriteDesigns() {
  return useApiOperation<BackendList<MeFavoriteDesign>>("GET /api/v1/me/favorite-designs");
}

export function useMeMembershipCard() {
  return useApiOperation<MeMembershipCard>("GET /api/v1/me/membership-card");
}

export function useMeMembershipProgress() {
  return useApiOperation<MeMembershipProgress>("GET /api/v1/me/membership-progress");
}

export function useMeNotifications(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<MeNotification>>("GET /api/v1/me/notifications", { query });
}

export function useMePointTransactions(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<MePointTransaction>>(
    "GET /api/v1/me/point-transactions",
    { query },
  );
}
