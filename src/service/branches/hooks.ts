"use client";

import useSWR from "swr";

import { apiRoutes, useApiOperation } from "../api";
import type { ApiClientError } from "../api";
import type { BackendList } from "../admin/types";
import type { Branch, BranchService, BranchServiceCategory, BranchStaff } from "./types";

export function useBranches() {
  const result = useSWR<Branch[], ApiClientError>(apiRoutes.catalog.branches);

  return {
    ...result,
    branches: result.data ?? [],
  };
}

export function useBranch(branchId: string | null) {
  return useApiOperation<Branch>(
    branchId ? "GET /api/v1/branches/{branchId}" : null,
    { path: branchId ? { branchId } : undefined },
  );
}

export function useBranchServiceCategories(branchId: string | null) {
  return useApiOperation<BackendList<BranchServiceCategory>>(
    branchId ? "GET /api/v1/branches/{branchId}/service-categories" : null,
    { path: branchId ? { branchId } : undefined },
  );
}

export function useBranchServices(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<BranchService>>(
    branchId ? "GET /api/v1/branches/{branchId}/services" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}

export function useBranchService(branchId: string | null, serviceId: string | null) {
  return useApiOperation<BranchService>(
    branchId && serviceId ? "GET /api/v1/branches/{branchId}/services/{serviceId}" : null,
    { path: branchId && serviceId ? { branchId, serviceId } : undefined },
  );
}

export function useBranchEligibleStaff(
  branchId: string | null,
  query?: Readonly<Record<string, string | number | undefined>>,
) {
  return useApiOperation<BackendList<BranchStaff>>(
    branchId ? "GET /api/v1/branches/{branchId}/eligible-staff" : null,
    { path: branchId ? { branchId } : undefined, query },
  );
}
