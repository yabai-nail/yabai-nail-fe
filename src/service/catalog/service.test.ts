import { describe, expect, it } from "vitest";

import { getApiOperation } from "../api";
import { catalogService } from "./service";

const CATALOG_OPERATION_IDS = [
  "GET /api/v1/app-bootstrap",
  "GET /api/v1/customer-home",
  "GET /api/v1/localization/languages",
  "GET /api/v1/promotions",
  "GET /api/v1/nail-designs",
  "GET /api/v1/nail-designs/{designId}",
  "GET /api/v1/reviews",
] as const;

const BRANCHES_PUBLIC_IDS = [
  "GET /api/v1/branches",
  "GET /api/v1/branches/{branchId}",
  "GET /api/v1/branches/{branchId}/service-categories",
  "GET /api/v1/branches/{branchId}/services",
  "GET /api/v1/branches/{branchId}/services/{serviceId}",
  "GET /api/v1/branches/{branchId}/eligible-staff",
] as const;

describe("catalogService", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of CATALOG_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each public catalog operation", () => {
    for (const fn of [
      catalogService.appBootstrap,
      catalogService.customerHome,
      catalogService.languages,
      catalogService.promotions,
      catalogService.nailDesigns,
      catalogService.nailDesign,
      catalogService.reviews,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});

describe("public branch sub-resources", () => {
  it("names every branch sub-resource operation", () => {
    for (const id of BRANCHES_PUBLIC_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });
});
