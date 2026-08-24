import { describe, expect, it } from "vitest";
import {
  adaptDesign,
  designFixtures,
  designStatuses,
  filterDesigns,
  paginate,
} from "./data";

describe("nail design derivation", () => {
  it("filters by status and name query", () => {
    expect(filterDesigns(designFixtures, "PUBLISHED", "").map((d) => d.id)).toEqual(["nd1", "nd2"]);
    expect(filterDesigns(designFixtures, "all", "french").map((d) => d.id)).toEqual(["nd3"]);
  });

  it("lists distinct statuses sorted", () => {
    expect(designStatuses(designFixtures)).toEqual(["ARCHIVED", "DRAFT", "PUBLISHED"]);
  });

  it("adapts a backend design", () => {
    const row = adaptDesign({ id: "d1", name: "X", imageUrl: "u", status: "DRAFT", version: 2 });
    expect(row).toMatchObject({ id: "d1", imageUrl: "u", status: "DRAFT", version: 2 });
  });

  it("paginates and rejects invalid page size", () => {
    expect(paginate(designFixtures, 5, 2).page).toBe(2);
    expect(() => paginate(designFixtures, 1, 0)).toThrow(RangeError);
  });
});
