import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { getAccessTokenForUrl } from "./auth-token";
import type { AuthScope } from "./auth-token";
import { normalizeApiError } from "./contracts";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// A one-shot retry flag rides on the request config so a refreshed retry never loops.
type RetryableConfig = InternalAxiosRequestConfig & {
  __retried?: boolean;
  authScope?: AuthScope;
};

interface CreateApiClientOptions {
  readonly baseURL?: string;
  readonly getAccessToken?: (url: string, scope?: AuthScope) => string | null;
  /**
   * Called once when an admin request comes back 401. Resolve to a fresh
   * access token to have the request retried, or null to let the 401 through.
   * Injected rather than imported so the client stays free of the auth module.
   */
  readonly refreshAdminAccessToken?: () => Promise<string | null>;
}

// AuthProvider registers the real refresher at mount. Module-level because the
// shared `apiClient` below is built once, before any React tree exists.
let adminTokenRefresher: (() => Promise<string | null>) | null = null;

// The toast layer registers this so admin write failures surface as a notification, not just
// an inline message a user can miss. Injected (not imported) to keep this client UI-agnostic.
let mutationErrorNotifier: ((error: unknown) => void) | null = null;

export function setMutationErrorNotifier(
  notifier: ((error: unknown) => void) | null,
): void {
  mutationErrorNotifier = notifier;
}

function isRelativeBackendUrl(url: string): boolean {
  return !/^[a-z][a-z\d+.-]*:\/\//i.test(url);
}

export function setAdminTokenRefresher(
  refresher: (() => Promise<string | null>) | null,
): void {
  adminTokenRefresher = refresher;
}

export function createApiClient({
  baseURL = API_BASE_URL,
  getAccessToken: resolveAccessToken = getAccessTokenForUrl,
  refreshAdminAccessToken = () => adminTokenRefresher?.() ?? Promise.resolve(null),
}: CreateApiClientOptions = {}): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 10_000,
    headers: { Accept: "application/json" },
  });

  client.interceptors.request.use((config) => {
    const url = config.url ?? "";
    const targetsBackend = isRelativeBackendUrl(url);
    const token = targetsBackend
      ? resolveAccessToken(url, (config as RetryableConfig).authScope)
      : null;
    if (token && targetsBackend) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });
  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      // An hour into a shift the access token expires. Refresh once and replay
      // the request so the admin does not get thrown back to the sign-in form
      // mid-checkout. `__retried` keeps a still-401 retry from looping.
      const config = axios.isAxiosError(error)
        ? (error.config as (RetryableConfig & { url?: string }) | undefined)
        : undefined;
      const isAdminRequest =
        isRelativeBackendUrl(config?.url ?? "") &&
        (config?.authScope === "admin" || (config?.url ?? "").includes("/admin/"));
      const status =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 401 && config && !config.__retried && isAdminRequest) {
        config.__retried = true;
        const token = await refreshAdminAccessToken();
        if (token) {
          config.headers?.set?.("Authorization", `Bearer ${token}`);
          return client.request(config);
        }
      }
      const normalized = normalizeApiError(error);
      // Surface admin write failures (create/update/delete) as a toast so they are noticed and
      // not just shown inline. GETs stay silent — they render their own load states; 401 is the
      // session-refresh flow above; auth endpoints (login/refresh) show their own form errors.
      const method = (config?.method ?? "get").toLowerCase();
      const isMutation = method === "post" || method === "put" || method === "patch" || method === "delete";
      if (isAdminRequest && isMutation && status !== 401 && !(config?.url ?? "").includes("/auth/")) {
        mutationErrorNotifier?.(normalized);
      }
      return Promise.reject(normalized);
    },
  );

  return client;
}

export const apiClient = createApiClient();
