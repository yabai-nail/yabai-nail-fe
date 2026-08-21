import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("../api", () => ({
  apiRequest,
  apiRoutes: { catalog: { branches: "/branches" } },
}));

import { branchesService } from "./service";

describe("branchesService", () => {
  beforeEach(() => apiRequest.mockReset());

  it("loads the public branch catalog through the shared API client", async () => {
    apiRequest.mockResolvedValue([{ id: "branch-1", name: "YABAI" }]);

    await expect(branchesService.list()).resolves.toEqual([
      { id: "branch-1", name: "YABAI" },
    ]);
    expect(apiRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/branches",
    });
  });
});
