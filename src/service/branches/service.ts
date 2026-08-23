import { executeApiOperation } from "../api";
import type { BackendList } from "../admin/types";
import type { Branch, BranchService, BranchServiceCategory, BranchStaff } from "./types";

export const branchesService = {
  // Public browse. Uses the canonical catalog operation so tests catch a route
  // rename and the generic client applies the same defaults every other
  // read shares (typed response, cancellable signal via config).
  list: (query?: Readonly<Record<string, string | number | undefined>>) =>
    executeApiOperation<BackendList<Branch>>("GET /api/v1/branches", { query }),
  detail: (branchId: string) =>
    executeApiOperation<Branch>("GET /api/v1/branches/{branchId}", { path: { branchId } }),
  serviceCategories: (branchId: string) =>
    executeApiOperation<BackendList<BranchServiceCategory>>(
      "GET /api/v1/branches/{branchId}/service-categories",
      { path: { branchId } },
    ),
  services: (
    branchId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<BackendList<BranchService>>(
      "GET /api/v1/branches/{branchId}/services",
      { path: { branchId }, query },
    ),
  serviceDetail: (branchId: string, serviceId: string) =>
    executeApiOperation<BranchService>(
      "GET /api/v1/branches/{branchId}/services/{serviceId}",
      { path: { branchId, serviceId } },
    ),
  eligibleStaff: (
    branchId: string,
    query?: Readonly<Record<string, string | number | undefined>>,
  ) =>
    executeApiOperation<BackendList<BranchStaff>>(
      "GET /api/v1/branches/{branchId}/eligible-staff",
      { path: { branchId }, query },
    ),
};
