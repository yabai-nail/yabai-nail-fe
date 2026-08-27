import type { AxiosAdapter } from "axios";
import { describe, expect, it } from "vitest";

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
