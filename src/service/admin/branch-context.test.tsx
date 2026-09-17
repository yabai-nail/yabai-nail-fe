import { describe, expect, it } from "vitest";

import { resolveActiveBranchId, scopedBranchIds } from "./branch-context";

// Every branch-selection rule the Provider needs lives in this pure resolver.
// Testing the resolver alone means no React tree, no localStorage double, no
// jsdom — just data in, data out. The Provider wires the resolver to state.

describe("resolveActiveBranchId", () => {
  it("returns the first accessible branch when nothing is stored", () => {
    expect(resolveActiveBranchId(null, ["branch-1", "branch-2"])).toBe("branch-1");
  });

  it("keeps a stored branch that the admin still owns", () => {
    expect(resolveActiveBranchId("branch-2", ["branch-1", "branch-2"])).toBe("branch-2");
  });

  it("falls back when the stored id is no longer accessible", () => {
    expect(resolveActiveBranchId("branch-gone", ["branch-1"])).toBe("branch-1");
  });

  it("returns null when the admin has no branches at all", () => {
    expect(resolveActiveBranchId(null, [])).toBeNull();
    // A stale stored id also collapses to null — never invent access
    // the current admin does not actually have.
    expect(resolveActiveBranchId("branch-1", [])).toBeNull();
  });
});

describe("scopedBranchIds", () => {
  // The API's own rule: an owner may act on any branch in the chain and is stored with an
  // empty branchIds on purpose, while a manager's scope is exactly branchIds. Using the
  // stored list as everyone's scope left an owner with no branch switcher at all.
  it("gives an owner every branch the list knows", () => {
    expect(scopedBranchIds({ isOwner: true, ownBranchIds: [], allBranchIds: ["b1", "b2", "b3"] }))
      .toEqual(["b1", "b2", "b3"]);
  });

  it("falls back to the stored ids while the owner's branch list is still loading", () => {
    expect(scopedBranchIds({ isOwner: true, ownBranchIds: ["b2"], allBranchIds: [] })).toEqual(["b2"]);
  });

  it("keeps a manager inside their own branches even when the whole list is known", () => {
    expect(scopedBranchIds({ isOwner: false, ownBranchIds: ["b2"], allBranchIds: ["b1", "b2", "b3"] }))
      .toEqual(["b2"]);
  });
});
