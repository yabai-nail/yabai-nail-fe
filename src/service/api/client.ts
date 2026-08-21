import axios, { type AxiosInstance } from "axios";

import { getAccessToken } from "./auth-token";
import { normalizeApiError } from "./contracts";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface CreateApiClientOptions {
  readonly baseURL?: string;
  readonly getAccessToken?: () => string | null;
}

export function createApiClient({
  baseURL = API_BASE_URL,
  getAccessToken: resolveAccessToken = getAccessToken,
}: CreateApiClientOptions = {}): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 10_000,
    headers: { Accept: "application/json" },
  });

  client.interceptors.request.use((config) => {
    const token = resolveAccessToken();
    const isRelativeBackendUrl = !/^[a-z][a-z\d+.-]*:\/\//i.test(config.url ?? "");
    if (token && isRelativeBackendUrl) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(normalizeApiError(error)),
  );

  return client;
}

export const apiClient = createApiClient();
