import type { AxiosRequestConfig } from "axios";

import { getApiOperation, buildOperationPath, type ApiOperationId, type ApiPathParams } from "./operations";
import { apiRequest } from "./request";

type QueryValue = string | number | boolean | null | undefined | ReadonlyArray<string | number | boolean>;

export interface ExecuteApiOperationOptions {
  readonly path?: ApiPathParams;
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
  readonly idempotencyKey?: string;
  readonly version?: string | number;
  readonly signal?: AbortSignal;
  readonly config?: Omit<AxiosRequestConfig, "method" | "url" | "params" | "data" | "headers" | "signal">;
}

export async function executeApiOperation<T>(
  id: ApiOperationId,
  options: ExecuteApiOperationOptions = {},
): Promise<T> {
  const operation = getApiOperation(id);
  const headers: Record<string, string> = {};

  if (operation.method !== "GET") {
    headers["Idempotency-Key"] = options.idempotencyKey ?? crypto.randomUUID();
  }
  if (options.version !== undefined) {
    headers["If-Match"] = String(options.version);
  }

  return apiRequest<T>({
    ...options.config,
    method: operation.method,
    url: buildOperationPath(operation, options.path),
    ...(options.query ? { params: options.query } : {}),
    ...(options.body !== undefined ? { data: options.body } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });
}
