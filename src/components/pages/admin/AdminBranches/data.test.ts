import { describe, expect, it } from "vitest";
import {
  adaptBranch,
  branchFixtures,
  branchStatusFromActive,
  filterBranches,
  paginate,
} from "./data";

describe("branch list derivation", () => {
  it("filters by name/address/phone query", () => {
    expect(filterBranches(branchFixtures, "hà nội").map((b) => b.id)).toEqual(["br3"]);
    expect(filterBranches(branchFixtures, "lê lợi").map((b) => b.id)).toEqual(["br2"]);
    expect(filterBranches(branchFixtures, "")).toHaveLength(branchFixtures.length);
  });

  it("maps the backend active flag to a status code", () => {
    expect(branchStatusFromActive(true)).toBe("ACTIVE");
    expect(branchStatusFromActive(false)).toBe("INACTIVE");
    expect(branchStatusFromActive(undefined)).toBeUndefined();
  });

  it("adapts a backend branch, reading active (not status)", () => {
    const row = adaptBranch({ id: "b1", name: "X", address: "a", active: true, version: 4 });
    expect(row).toMatchObject({ id: "b1", address: "a", status: "ACTIVE", version: 4 });

    expect(adaptBranch({ id: "b2", name: "Y", active: false, version: 1 }).status).toBe("INACTIVE");
    // Backend không có cột phone cho chi nhánh -> luôn undefined, bảng hiển thị "—".
    expect(adaptBranch({ id: "b3", name: "Z", active: true, version: 1 }).phone).toBeUndefined();
  });

  it("paginates and rejects invalid page size", () => {
    expect(paginate(branchFixtures, 1, 2).items).toHaveLength(2);
    expect(() => paginate(branchFixtures, 1, 0)).toThrow(RangeError);
  });
});
