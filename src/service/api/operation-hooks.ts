"use client";

import useSWR, { type SWRConfiguration } from "swr";

import type { ApiClientError } from "./contracts";
import { executeApiOperation, type ExecuteApiOperationOptions } from "./operation-client";
import { getApiOperation, type ApiOperationId } from "./operations";

export function useApiOperation<T>(
  id: ApiOperationId | null,
  options: ExecuteApiOperationOptions = {},
  config?: SWRConfiguration<T, ApiClientError>,
) {
  if (id && getApiOperation(id).method !== "GET") {
    throw new Error(`useApiOperation only accepts GET operations: ${id}`);
  }

  const operationKey = id
    ? (["backend-operation", id, options.path, options.query] as const)
    : null;

  return useSWR<T, ApiClientError>(
    operationKey,
    () => executeApiOperation<T>(id!, options),
    config,
  );
}
