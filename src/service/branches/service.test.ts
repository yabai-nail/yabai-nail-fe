import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeApiOperation } = vi.hoisted(() => ({ executeApiOperation: vi.fn() }));

vi.mock("../api", () => ({ executeApiOperation }));

import { branchesService } from "./service";

describe("branchesService", () => {
  beforeEach(() => executeApiOperation.mockReset());

  it("lists the public branch catalog through the canonical operation", async () => {
    executeApiOperation.mockResolvedValue({
      items: [{ id: "branch-1", name: "YABAI" }],
    });

    await expect(branchesService.list()).resolves.toEqual({
      items: [{ id: "branch-1", name: "YABAI" }],
    });
    expect(executeApiOperation).toHaveBeenCalledWith("GET /api/v1/branches", {
      query: undefined,
    });
  });

  it("forwards a query when the caller wants to narrow the list", async () => {
    executeApiOperation.mockResolvedValue({ items: [] });

    await branchesService.list({ city: "Fukuoka" });

    expect(executeApiOperation).toHaveBeenCalledWith("GET /api/v1/branches", {
      query: { city: "Fukuoka" },
    });
  });
});
