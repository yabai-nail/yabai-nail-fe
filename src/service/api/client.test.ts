import { AxiosError, type AxiosAdapter } from "axios";
import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";

describe("createApiClient", () => {
  it("uses the backend URL and attaches the bearer token", async () => {
    const client = createApiClient({
      baseURL: "http://localhost:4000/api/v1",
      getAccessToken: () => "token-1",
    });
    const adapter: AxiosAdapter = async (config) => {
      expect(config.baseURL).toBe("http://localhost:4000/api/v1");
      expect(config.headers.get("Authorization")).toBe("Bearer token-1");
      return {
        config,
        data: { data: [], meta: { requestId: "request-1", serverTime: "now" } },
        headers: {},
        status: 200,
        statusText: "OK",
      };
    };

    await client.get("/branches", { adapter });
  });

  it("does not send the bearer token to an absolute external URL", async () => {
    const client = createApiClient({ getAccessToken: () => "token-1" });
    const adapter: AxiosAdapter = async (config) => {
      expect(config.headers.get("Authorization")).toBeUndefined();
      return {
        config,
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      };
    };

    await client.get("https://example.com/data", { adapter });
  });

  it("does not refresh or leak an admin token when an external upload returns 401", async () => {
    const refreshAdminAccessToken = vi.fn().mockResolvedValue("fresh-admin-token");
    const client = createApiClient({
      getAccessToken: () => "admin-token",
      refreshAdminAccessToken,
    });
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError(
        "Unauthorized",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        { config, data: {}, headers: {}, status: 401, statusText: "Unauthorized" },
      );
    };

    await expect(client.request({
      url: "https://storage.example/signed-upload",
      method: "PUT",
      authScope: "admin",
      adapter,
    } as Parameters<typeof client.request>[0] & { authScope: "admin" })).rejects.toBeDefined();
    expect(refreshAdminAccessToken).not.toHaveBeenCalled();
  });

  it("uses an explicit admin token for a shared media route", async () => {
    const client = createApiClient({
      getAccessToken: (_url, scope) => scope === "admin" ? "admin-token" : "customer-token",
    });
    const adapter: AxiosAdapter = async (config) => {
      expect(config.headers.get("Authorization")).toBe("Bearer admin-token");
      return { config, data: {}, headers: {}, status: 200, statusText: "OK" };
    };

    await client.request({
      url: "/media/uploads",
      method: "POST",
      authScope: "admin",
      adapter,
    } as Parameters<typeof client.request>[0] & { authScope: "admin" });
  });
});
