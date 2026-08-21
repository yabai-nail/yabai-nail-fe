"use client";

import useSWR from "swr";

import { apiRoutes } from "../api";
import type { ApiClientError } from "../api";
import type { Branch } from "./types";

export function useBranches() {
  const result = useSWR<Branch[], ApiClientError>(apiRoutes.catalog.branches);

  return {
    ...result,
    branches: result.data ?? [],
  };
}
