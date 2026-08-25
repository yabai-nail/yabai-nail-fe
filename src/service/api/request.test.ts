import { describe, expect, it, vi } from "vitest";

import { apiRequest } from "./request";

// The bug this guards: a bare-array `data` must reach the caller as `{ items }`,
// because every list hook reads `.items`. A single-object `data` must pass
// through untouched.
vi.mock("./client", () => ({
  apiClient: {
    request: vi.fn(async (config: { __data: unknown }) => ({
      data: { data: config.__data, meta: { requestId: "r", serverTime: "t" } },
    })),
  },
}));

describe("apiRequest list normalisation", () => {
  it("wraps a bare array as { items }", async () => {
    const result = await apiRequest<{ items: number[] }>({
      // @ts-expect-error test seam carries the fake payload
      __data: [1, 2, 3],
    });
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it("leaves an object response untouched", async () => {
    const result = await apiRequest<{ items: number[] }>({
      // @ts-expect-error test seam carries the fake payload
      __data: { items: [9], pageInfo: { endCursor: null } },
    });
    expect(result).toEqual({ items: [9], pageInfo: { endCursor: null } });
  });

  it("leaves a single record untouched", async () => {
    const result = await apiRequest<{ id: string }>({
      // @ts-expect-error test seam carries the fake payload
      __data: { id: "branch-1" },
    });
    expect(result).toEqual({ id: "branch-1" });
  });
});
