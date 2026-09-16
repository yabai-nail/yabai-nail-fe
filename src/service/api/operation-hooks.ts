"use client";

import useSWR, { type SWRConfiguration } from "swr";

import type { ApiClientError } from "./contracts";
import {
  executeApiOperation,
  executePaginatedApiOperation,
  type ExecuteApiOperationOptions,
} from "./operation-client";
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

export function usePaginatedApiOperation<T>(
  id: ApiOperationId | null,
  options: ExecuteApiOperationOptions = {},
  config?: SWRConfiguration<{
    readonly items: ReadonlyArray<T>;
    readonly pageInfo?: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
      readonly limit: number;
    };
  }, ApiClientError>,
) {
  if (id && getApiOperation(id).method !== "GET") {
    throw new Error(`usePaginatedApiOperation only accepts GET operations: ${id}`);
  }

  const operationKey = id
    ? (["backend-paginated-operation", id, options.path, options.query] as const)
    : null;

  return useSWR(
    operationKey,
    () => executePaginatedApiOperation<T>(id!, options),
    config,
  );
}
