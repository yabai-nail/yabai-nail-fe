import { executeApiOperation } from "../api";
import type { BackendList } from "../admin/types";
import type {
  AppBootstrap,
  CustomerHome,
  LocalizationLanguage,
  NailDesign,
  PublicPromotion,
  PublicReview,
} from "./types";

export const catalogService = {
  appBootstrap: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<AppBootstrap>("GET /api/v1/app-bootstrap", { query }),
  customerHome: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<CustomerHome>("GET /api/v1/customer-home", { query }),
  languages: () =>
    executeApiOperation<BackendList<LocalizationLanguage>>("GET /api/v1/localization/languages"),
  promotions: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<PublicPromotion>>("GET /api/v1/promotions", { query }),
  nailDesigns: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<NailDesign>>("GET /api/v1/nail-designs", { query }),
  nailDesign: (designId: string) =>
    executeApiOperation<NailDesign>("GET /api/v1/nail-designs/{designId}", {
      path: { designId },
    }),
  reviews: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<PublicReview>>("GET /api/v1/reviews", { query }),
};
