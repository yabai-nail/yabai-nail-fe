"use client";

import { useApiOperation } from "../api";
import type { BackendList } from "../admin/types";
import type {
  AppBootstrap,
  CustomerHome,
  LocalizationLanguage,
  NailDesign,
  PublicPromotion,
  PublicReview,
} from "./types";

export function useAppBootstrap(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<AppBootstrap>("GET /api/v1/app-bootstrap", { query });
}

export function useCustomerHome(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<CustomerHome>("GET /api/v1/customer-home", { query });
}

export function useLocalizationLanguages() {
  return useApiOperation<BackendList<LocalizationLanguage>>(
    "GET /api/v1/localization/languages",
  );
}

export function usePublicPromotions(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<PublicPromotion>>("GET /api/v1/promotions", { query });
}

export function useNailDesigns(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<NailDesign>>("GET /api/v1/nail-designs", { query });
}

export function useNailDesign(designId: string | null) {
  return useApiOperation<NailDesign>(
    designId ? "GET /api/v1/nail-designs/{designId}" : null,
    { path: designId ? { designId } : undefined },
  );
}

export function usePublicReviews(
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<PublicReview>>("GET /api/v1/reviews", { query });
}
