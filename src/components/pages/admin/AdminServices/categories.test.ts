import { describe, expect, it } from "vitest";
import type { AdminServiceCategory } from "@/service";
import { filterCategories, moveCategory } from "./categories";

const category = (id: string, code: string, nameVi: string, sortOrder: number): AdminServiceCategory => ({
  id,
  code,
  name: nameVi,
  nameVi,
  status: "ACTIVE",
  serviceIds: [],
  sortOrder,
  version: 1,
});

const catalogue = [
  category("c1", "GEL", "Sơn gel Nhật Bản", 0),
  category("c2", "CARE", "Chăm sóc móng", 1),
  category("c3", "TEST2", "Danh muc test 2", 2),
];

describe("category list derivation", () => {
  it("finds a category by its display name, ignoring case", () => {
    // The shared admin matcher lowercases but keeps diacritics, and every other list behaves
    // this way -- categories must not be the one place that searches differently.
    expect(filterCategories(catalogue, "SƠN GEL").map((row) => row.id)).toEqual(["c1"]);
  });

  it("finds a category by its code, which is what the salon types", () => {
    expect(filterCategories(catalogue, "care").map((row) => row.id)).toEqual(["c2"]);
  });

  it("returns the whole catalogue for an empty query", () => {
    expect(filterCategories(catalogue, "  ")).toHaveLength(3);
  });
});

describe("category reordering", () => {
  it("moves a category down without mutating the original order", () => {
    const ids = ["c1", "c2", "c3"];

    expect(moveCategory(ids, 0, 1)).toEqual(["c2", "c1", "c3"]);
    expect(ids).toEqual(["c1", "c2", "c3"]);
  });

  it("moves a category up across more than one place", () => {
    expect(moveCategory(["c1", "c2", "c3"], 2, 0)).toEqual(["c3", "c1", "c2"]);
  });

  it("leaves the order alone when the target sits outside the list", () => {
    // A drop past the last row must not silently delete the dragged category.
    expect(moveCategory(["c1", "c2", "c3"], 0, 3)).toEqual(["c1", "c2", "c3"]);
    expect(moveCategory(["c1", "c2", "c3"], 0, -1)).toEqual(["c1", "c2", "c3"]);
  });
});
