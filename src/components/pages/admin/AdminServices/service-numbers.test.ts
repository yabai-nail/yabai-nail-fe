import { describe, expect, it } from "vitest";

import { isValidServiceAmount, parseCatalogInteger } from "./service-numbers";

describe("service whole-number fields", () => {
  it("keeps zero distinct from blank or malformed input", () => {
    expect(parseCatalogInteger("0")).toBe(0);
    expect(parseCatalogInteger("9,000")).toBe(9000);
    expect(parseCatalogInteger("")).toBeNull();
    expect(parseCatalogInteger("-1")).toBeNull();
    expect(parseCatalogInteger("1.5")).toBeNull();
  });

  it("allows zero only for add-ons", () => {
    expect(isValidServiceAmount(0, "ADD_ON")).toBe(true);
    expect(isValidServiceAmount(0, "BASE")).toBe(false);
    expect(isValidServiceAmount(1, "BASE")).toBe(true);
    expect(isValidServiceAmount(null, "ADD_ON")).toBe(false);
  });
});
