import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiOperationId } from "./operations";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("./request", () => ({ apiRequest }));

import { executeApiOperation } from "./operation-client";

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
});
