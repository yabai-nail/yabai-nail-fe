import { describe, expect, it } from "vitest";
import { pageWindow, paginate } from "./admin-pagination";

describe("paginate", () => {
  const rows = Array.from({ length: 14 }, (_, index) => index + 1);

  it("slices the requested page and clamps an out-of-range one", () => {
    expect(paginate(rows, 2, 8)).toEqual({ items: [9, 10, 11, 12, 13, 14], page: 2, pageCount: 2 });
    expect(paginate(rows, 9, 8).page).toBe(2);
    expect(paginate([], 1, 8)).toEqual({ items: [], page: 1, pageCount: 1 });
  });

  it("refuses a page size that is not a positive integer", () => {
    expect(() => paginate(rows, 1, 0)).toThrow(RangeError);
    expect(() => paginate(rows, 1, 2.5)).toThrow(RangeError);
  });
});

describe("pagination window", () => {
  it("shows every page while they all fit", () => {
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it("keeps the first and last page in reach from the middle", () => {
    expect(pageWindow(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  });

  it("only trails an ellipsis while near the start", () => {
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
  });

  it("only leads with one while near the end", () => {
    expect(pageWindow(19, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
  });

  it("clamps a page number outside the range", () => {
    expect(pageWindow(0, 20)).toEqual(pageWindow(1, 20));
    expect(pageWindow(99, 20)).toEqual(pageWindow(20, 20));
  });

  it("never hides a single page behind an ellipsis", () => {
    // An ellipsis standing in for one page is worse than the page: same width, no destination.
    for (let pageCount = 1; pageCount <= 30; pageCount += 1) {
      for (let current = 1; current <= pageCount; current += 1) {
        const slots = pageWindow(current, pageCount);
        slots.forEach((slot, index) => {
          if (slot !== "ellipsis") return;
          const before = slots[index - 1];
          const after = slots[index + 1];
          expect(typeof before === "number" && typeof after === "number").toBe(true);
          expect((after as number) - (before as number)).toBeGreaterThan(2);
        });
      }
    }
  });

  it("returns a stable number of slots for any long list", () => {
    for (let current = 1; current <= 40; current += 1) {
      expect(pageWindow(current, 40)).toHaveLength(7);
    }
  });
});
