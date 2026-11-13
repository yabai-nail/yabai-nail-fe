import { describe, expect, it } from "vitest";
import {
  adaptDesign,
  CUSTOM_PRICE,
  designFixtures,
  designStatuses,
  filterDesigns,
  filterDesignsByTier,
  isOnSale,
  paginate,
  upsertDesignInList,
} from "./data";

describe("design price tiers and sales", () => {
  const sale = { saleId: "s1", name: "Tết", price: 5000, endsAt: "2026-12-01T00:00:00.000Z" };
  const rows = [
    adaptDesign({ id: "a", title: "A", status: "DRAFT", version: 1, indicativePrice: 6600, priceTierId: "t1" }),
    adaptDesign({ id: "b", title: "B", status: "DRAFT", version: 1, indicativePrice: 8800, priceTierId: "t2", sale }),
    adaptDesign({ id: "c", title: "C", status: "DRAFT", version: 1, indicativePrice: 7000, priceTierId: null }),
    adaptDesign({ id: "d", title: "D", status: "DRAFT", version: 1 }),
  ];

  it("reads the tier and the running sale off a backend design", () => {
    expect(rows[1]).toMatchObject({ priceTierId: "t2", sale });
    expect(rows[3]).toMatchObject({ priceTierId: null, sale: null });
  });

  it("keeps every row when no tier is ticked", () => {
    expect(filterDesignsByTier(rows, []).map((row) => row.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("keeps the rows on the ticked tiers", () => {
    expect(filterDesignsByTier(rows, ["t2"]).map((row) => row.id)).toEqual(["b"]);
    expect(filterDesignsByTier(rows, ["t1", "t2"]).map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("treats the custom option as every design with its own typed price", () => {
    expect(CUSTOM_PRICE).toBe("custom");
    expect(filterDesignsByTier(rows, [CUSTOM_PRICE]).map((row) => row.id)).toEqual(["c", "d"]);
    expect(filterDesignsByTier(rows, ["t1", CUSTOM_PRICE]).map((row) => row.id)).toEqual(["a", "c", "d"]);
  });

  it("accepts another value for the custom option", () => {
    expect(filterDesignsByTier(rows, ["own"], "own").map((row) => row.id)).toEqual(["c", "d"]);
  });

  it("is on sale only while the API reports a sale", () => {
    expect(rows.map(isOnSale)).toEqual([false, true, false, false]);
  });
});

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

  it("updates the cached price immediately while preserving zero and an omitted price", () => {
    const current = {
      items: [
        { id: "d1", title: "Priced", indicativePrice: 12000, status: "DRAFT", version: 1 },
        { id: "d2", title: "Zero", indicativePrice: 0, status: "DRAFT", version: 1 },
      ],
    };

    const cleared = upsertDesignInList(current, {
      ...current.items[0],
      indicativePrice: null,
      version: 2,
    });

    expect(cleared?.items[0]).toMatchObject({ id: "d1", indicativePrice: null, version: 2 });
    expect(cleared?.items[1]).toMatchObject({ id: "d2", indicativePrice: 0 });
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
