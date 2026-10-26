import { describe, expect, it } from "vitest";
import { normalizeHighlights } from "./service-highlights";

describe("service highlights", () => {
  it("trims rows, omits unused inputs and preserves their order", () => {
    expect(normalizeHighlights([" 持ち込みOK ", "", "  ", "4 charms included"]))
      .toEqual(["持ち込みOK", "4 charms included"]);
  });
  it("allows clearing every row", () => {
    expect(normalizeHighlights([])).toEqual([]);
  });
});
