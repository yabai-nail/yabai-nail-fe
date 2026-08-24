import { describe, expect, it } from "vitest";
import { adaptBranch, branchFixtures, filterBranches, paginate } from "./data";

describe("branch list derivation", () => {
  it("filters by name/address/phone query", () => {
    expect(filterBranches(branchFixtures, "hà nội").map((b) => b.id)).toEqual(["br3"]);
    expect(filterBranches(branchFixtures, "lê lợi").map((b) => b.id)).toEqual(["br2"]);
    expect(filterBranches(branchFixtures, "")).toHaveLength(branchFixtures.length);
  });

  it("adapts a backend branch", () => {
    const row = adaptBranch({ id: "b1", name: "X", address: "a", phone: "p", status: "ACTIVE", version: 4 });
    expect(row).toMatchObject({ id: "b1", address: "a", status: "ACTIVE", version: 4 });
  });

  it("paginates and rejects invalid page size", () => {
    expect(paginate(branchFixtures, 1, 2).items).toHaveLength(2);
    expect(() => paginate(branchFixtures, 1, 0)).toThrow(RangeError);
  });
});
