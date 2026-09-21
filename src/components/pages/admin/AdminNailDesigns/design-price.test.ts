import { describe, expect, it } from "vitest";

import { parseIndicativePrice } from "./design-price";

describe("nail design indicative price", () => {
  it("distinguishes an omitted price, zero and invalid values", () => {
    expect(parseIndicativePrice("")).toBeNull();
    expect(parseIndicativePrice("0")).toBe(0);
    expect(parseIndicativePrice("12,000")).toBe(12000);
    expect(parseIndicativePrice("-1")).toBeUndefined();
    expect(parseIndicativePrice("1.5")).toBeUndefined();
  });
});
