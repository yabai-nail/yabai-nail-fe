import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiOperationId } from "./operations";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("./request", () => ({ apiRequest }));

import { executeApiOperation, executePaginatedApiOperation } from "./operation-client";

describe("executeApiOperation", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    apiRequest.mockResolvedValue({ ok: true });
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("maps query parameters for reads", async () => {
    await executeApiOperation(
      "GET /api/v1/admin/branches/{branchId}/appointments",
      { path: { branchId: "b1" }, query: { status: ["CONFIRMED", "COMPLETED"], limit: 20 } },
    );

    expect(apiRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/admin/branches/b1/appointments",
      params: { status: ["CONFIRMED", "COMPLETED"], limit: 20 },
    });
  });

  it("adds idempotency and version headers to writes", async () => {
    const operation: ApiOperationId =
      "PATCH /api/v1/admin/services/{serviceId}";

    await executeApiOperation(operation, {
      path: { serviceId: "s1" },
      body: { name: "Gel" },
      version: "7",
    });

    expect(apiRequest).toHaveBeenCalledWith({
      method: "PATCH",
      url: "/admin/services/s1",
      data: { name: "Gel" },
      headers: {
        "Idempotency-Key": "11111111-1111-4111-8111-111111111111",
        "If-Match": "7",
      },
    });
  });

  it("forwards an explicit auth scope for shared media routes", async () => {
    await executeApiOperation("POST /api/v1/media/uploads", {
      body: { filename: "after.png" },
      authScope: "admin",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/media/uploads",
        authScope: "admin",
      }),
    );
  });

  it("follows cursor pages and returns a complete collection", async () => {
    apiRequest
      .mockResolvedValueOnce({
        items: [{ id: "first" }],
        pageInfo: { endCursor: "next", hasNextPage: true, limit: 100 },
      })
      .mockResolvedValueOnce({
        items: [{ id: "second" }],
        pageInfo: { endCursor: null, hasNextPage: false, limit: 100 },
      });

    const result = await executePaginatedApiOperation<{ id: string }>(
      "GET /api/v1/admin/services",
      { query: { branchId: "b1" } },
    );

    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      method: "GET",
      url: "/admin/services",
      params: { branchId: "b1", limit: 100 },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      method: "GET",
      url: "/admin/services",
      params: { branchId: "b1", limit: 100, cursor: "next" },
    });
    expect(result).toEqual({
      items: [{ id: "first" }, { id: "second" }],
      pageInfo: { endCursor: null, hasNextPage: false, limit: 2 },
    });
  });

  it("rejects a repeated pagination cursor instead of returning partial data", async () => {
    apiRequest.mockResolvedValue({
      items: [],
      pageInfo: { endCursor: "same", hasNextPage: true, limit: 100 },
    });

    await expect(
      executePaginatedApiOperation("GET /api/v1/admin/services"),
    ).rejects.toThrow("Invalid pagination cursor");
  });

  it("accepts a legacy bare-array list during a rolling API deployment", async () => {
    apiRequest.mockResolvedValue([{ id: "legacy" }]);

    await expect(
      executePaginatedApiOperation<{ id: string }>("GET /api/v1/admin/accounts"),
    ).resolves.toEqual({
      items: [{ id: "legacy" }],
      pageInfo: { endCursor: null, hasNextPage: false, limit: 1 },
    });
  });
});
