import type { AxiosRequestConfig } from "axios";

import { apiClient } from "./client";
import { type ApiEnvelope, unwrapApiEnvelope } from "./contracts";

/**
 * The backend is inconsistent about list envelopes: some collection endpoints
 * (`/branches`, `/branches/{id}/services`, `/branches/{id}/eligible-staff`,
 * `/localization/languages`) return `data` as a bare array, while the rest
 * (`/promotions`, `/me/*`, admin lists) return `data: { items, pageInfo }`.
 * Every FE caller reads `.items`, so a bare array silently read as `.items`
 * came back `undefined` and the screen rendered empty — the customer branch
 * picker showed nothing even though a branch existed.
 *
 * Normalising here, at the one seam every request passes through, means a bare
 * array is always presented as `{ items }`. A `data` that is a single object
 * (a by-id read, a mutation result) is left untouched — only arrays are lists.
 *
 * ponytail: coerce at the boundary rather than patch ~26 hooks. If the backend
 * ever standardises on `{ items }`, delete this and nothing else changes.
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T>>(config);
  const data = unwrapApiEnvelope(response.data);
  if (Array.isArray(data)) {
    return { items: data } as unknown as T;
  }
  return data;
}
