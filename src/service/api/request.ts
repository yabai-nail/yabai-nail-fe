import type { AxiosRequestConfig } from "axios";

import { apiClient } from "./client";
import { type ApiEnvelope, unwrapApiEnvelope } from "./contracts";

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T>>(config);
  return unwrapApiEnvelope(response.data);
}
