import type { AxiosRequestConfig } from "axios";

import { apiRequest } from "./request";

export type ApiSWRKey = string | readonly [url: string, config?: AxiosRequestConfig];

export function apiFetcher<T>(key: ApiSWRKey): Promise<T> {
  const [url, config] = typeof key === "string" ? [key, undefined] : key;
  return apiRequest<T>({ ...config, method: "GET", url });
}
