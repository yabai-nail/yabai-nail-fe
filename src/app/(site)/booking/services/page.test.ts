import { describe, expect, it } from "vitest";

import { resolveBookingBranchId } from "./page";

const branches = [{ id: "branch-a" }, { id: "branch-b" }];

describe("resolveBookingBranchId", () => {
  it("keeps a requested published branch", () => {
    expect(resolveBookingBranchId(branches, "branch-b")).toBe("branch-b");
  });

  it("falls back to the first published branch for a missing or stale id", () => {
    expect(resolveBookingBranchId(branches, null)).toBe("branch-a");
    expect(resolveBookingBranchId(branches, "removed-branch")).toBe("branch-a");
  });

  it("returns null while no branch is available", () => {
    expect(resolveBookingBranchId([], "branch-b")).toBeNull();
  });
});
