import type { AxiosRequestConfig } from "axios";

import type { AuthScope } from "./auth-token";
import { getApiOperation, buildOperationPath, type ApiOperationId, type ApiPathParams } from "./operations";
import { apiRequest } from "./request";

export type QueryValue = string | number | boolean | null | undefined | ReadonlyArray<string | number | boolean>;

export interface ExecuteApiOperationOptions {
  readonly path?: ApiPathParams;
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
  readonly idempotencyKey?: string;
  readonly version?: string | number;
  readonly signal?: AbortSignal;
  readonly authScope?: AuthScope;
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

  const requestConfig: AxiosRequestConfig & { authScope?: AuthScope } = {
    ...options.config,
    method: operation.method,
    url: buildOperationPath(operation, options.path),
    ...(options.query ? { params: options.query } : {}),
    ...(options.body !== undefined ? { data: options.body } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.authScope ? { authScope: options.authScope } : {}),
  };
  return apiRequest<T>(requestConfig);
}

type CursorPage<T> = {
  readonly items: ReadonlyArray<T>;
  readonly pageInfo?: {
    readonly endCursor: string | null;
    readonly hasNextPage: boolean;
    readonly limit: number;
  };
};

/**
 * Reads every server page for a cursor collection.
 *
 * Admin tables still paginate their already-filtered rows in the browser, but
 * the API defaults to 20 records. Going through the cursor here keeps those
 * tables complete without teaching every screen its own network loop. A
 * repeated/missing cursor is treated as a contract error instead of silently
 * returning a partial list.
 */
export async function executePaginatedApiOperation<T>(
  id: ApiOperationId,
  options: ExecuteApiOperationOptions = {},
): Promise<CursorPage<T>> {
  const operation = getApiOperation(id);
  if (operation.method !== "GET") {
    throw new Error(`executePaginatedApiOperation only accepts GET operations: ${id}`);
  }

  const items: T[] = [];
  const seenCursors = new Set<string>();
  let cursor = typeof options.query?.cursor === "string" ? options.query.cursor : undefined;
  let lastPageInfo: CursorPage<T>["pageInfo"];

  for (;;) {
    const response = await executeApiOperation<CursorPage<T> | ReadonlyArray<T>>(id, {
      ...options,
      query: {
        ...options.query,
        limit: 100,
        ...(cursor ? { cursor } : {}),
      },
    });
    // Older deployments returned a bare array for a few Admin collections.
    // Treat it as one complete page so the UI keeps working during a rolling
    // API deploy; the canonical contract remains {items, pageInfo}.
    const page: CursorPage<T> = Array.isArray(response)
      ? { items: response, pageInfo: { endCursor: null, hasNextPage: false, limit: response.length } }
      : response as CursorPage<T>;
    items.push(...page.items);
    lastPageInfo = page.pageInfo;

    if (!page.pageInfo?.hasNextPage) break;
    const nextCursor = page.pageInfo.endCursor;
    if (!nextCursor || seenCursors.has(nextCursor)) {
      throw new Error(`Invalid pagination cursor returned by ${id}`);
    }
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  return {
    items,
    pageInfo: lastPageInfo
      ? { ...lastPageInfo, endCursor: null, hasNextPage: false, limit: items.length }
      : undefined,
  };
}
