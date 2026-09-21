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
    const row = adaptDesign({ id: "d1", title: "X", indicativePrice: 0, status: "DRAFT", version: 2 });
    expect(row).toMatchObject({ id: "d1", title: "X", indicativePrice: 0, status: "DRAFT", version: 2 });
  });

  it("maps a legacy missing price to null", () => {
    expect(adaptDesign({ id: "d2", title: "Legacy", status: "DRAFT", version: 1 }).indicativePrice).toBeNull();
  });

  it("paginates and rejects invalid page size", () => {
    expect(paginate(designFixtures, 5, 2).page).toBe(2);
    expect(() => paginate(designFixtures, 1, 0)).toThrow(RangeError);
  });
});

describe("design cover photo", () => {
  const base = { id: "nd9", title: "Ombre", status: "DRAFT", version: 1 };

  it("uses the stable public cover URL the API derived", () => {
    expect(adaptDesign({ ...base, thumbnailUrl: "https://api/media/m1/public-content" }).thumbnailUrl)
      .toBe("https://api/media/m1/public-content");
  });

  it("falls back to the first public image when no cover is named", () => {
    expect(adaptDesign({ ...base, images: ["https://api/media/m2/public-content"] }).thumbnailUrl)
      .toBe("https://api/media/m2/public-content");
  });

  it("has no cover for a row written before the API derived one", () => {
    // Such rows carry only mediaIds; those are private ids, not something an <img> can load.
    expect(adaptDesign({ ...base, mediaIds: ["m3"] }).thumbnailUrl).toBeNull();
  });
});
