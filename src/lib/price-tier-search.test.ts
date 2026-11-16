import { describe, expect, it } from "vitest";
import { compareTiers, filterTiers, isPinnedTier, matchesTierQuery, nextActiveIndex, sortTiers, tierPickerResults } from "./price-tier-search";

const tier = (id: string, name: string, amount: number, isPinned?: boolean) => ({ id, name, amount, isPinned });
const tiers = [
  tier("c", "Cao cấp", 9900),
  tier("a", "Mức giá ¥6,600", 6600, false),
  tier("p2", "Ưu tiên B", 8800, true),
  tier("b", "Basic", 6600),
  tier("p1", "Ưu tiên A", 8800, true),
  tier("legacy", "Legacy", 3300, undefined),
];

describe("price tier order", () => {
  it("puts pinned tiers first, then amount, name and id, like the API", () => {
    expect(sortTiers(tiers).map((item) => item.id)).toEqual(["p1", "p2", "legacy", "b", "a", "c"]);
  });

  it("breaks an exact name and amount tie by id", () => {
    expect(compareTiers(tier("x2", "Same", 1), tier("x1", "Same", 1))).toBeGreaterThan(0);
  });

  it("reads a tier without isPinned (older API) as unpinned", () => {
    expect(isPinnedTier(tier("legacy", "Legacy", 1))).toBe(false);
    expect(isPinnedTier(tier("p", "P", 1, true))).toBe(true);
  });

  it("does not reorder the caller's array", () => {
    const copy = [...tiers];
    sortTiers(copy);
    expect(copy).toEqual(tiers);
  });
});

describe("price tier search", () => {
  it.each([
    ["muc gia", ["a"]],
    ["ƯU TIÊN", ["p1", "p2"]],
    ["6600", ["b", "a"]],
    ["¥6,600", ["b", "a"]],
    ["６６００", ["b", "a"]],
    ["880", ["p1", "p2"]],
    ["zzz", []],
  ])("query %s matches by name or amount", (query, expected) => {
    expect(filterTiers(tiers, { query }).map((item) => item.id)).toEqual(expected);
  });

  it("matches everything for a blank query", () => {
    expect(matchesTierQuery(tiers[0], "   ")).toBe(true);
  });

  it("keeps only pinned tiers for the Pinned filter, combined with the query", () => {
    expect(filterTiers(tiers, { pinnedOnly: true }).map((item) => item.id)).toEqual(["p1", "p2"]);
    expect(filterTiers(tiers, { pinnedOnly: true, query: "B" }).map((item) => item.id)).toEqual(["p2"]);
  });
});

describe("price tier picker results", () => {
  it("caps the options and reports how many matched", () => {
    const many = Array.from({ length: 30 }, (_, index) => tier(`t${index}`, `Tier ${index}`, 1000 + index));
    const result = tierPickerResults(many, "tier", 12);
    expect(result.items).toHaveLength(12);
    expect(result.total).toBe(30);
    expect(result.items[0].id).toBe("t0");
  });

  it("lists pinned tiers before the rest", () => {
    expect(tierPickerResults(tiers, "", 3).items.map((item) => item.id)).toEqual(["p1", "p2", "legacy"]);
  });
});

describe("picker keyboard", () => {
  it("moves down and up with wrap-around", () => {
    expect(nextActiveIndex("ArrowDown", -1, 3)).toBe(0);
    expect(nextActiveIndex("ArrowDown", 2, 3)).toBe(0);
    expect(nextActiveIndex("ArrowUp", 0, 3)).toBe(2);
    expect(nextActiveIndex("ArrowUp", -1, 3)).toBe(2);
    expect(nextActiveIndex("ArrowUp", 2, 3)).toBe(1);
  });

  it("ignores other keys and an empty list", () => {
    expect(nextActiveIndex("Home", 1, 3)).toBeNull();
    expect(nextActiveIndex("ArrowDown", 0, 0)).toBeNull();
  });
});
