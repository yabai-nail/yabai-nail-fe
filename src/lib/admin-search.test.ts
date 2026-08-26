import { describe, expect, it } from "vitest";

import { matchesSearch } from "./admin-search";

describe("admin list search", () => {
  // The crash: an account with no phone. Typing one character threw
  // "Cannot read properties of null" and Next replaced the screen with
  // "This page couldn't load".
  it("skips a null field instead of throwing on it", () => {
    expect(() => matchesSearch("v", ["demo_1787586278", null])).not.toThrow();
    expect(matchesSearch("v", ["demo_1787586278", null])).toBe(false);
    expect(matchesSearch("demo", ["demo_1787586278", null])).toBe(true);
  });

  it("skips undefined the same way", () => {
    expect(matchesSearch("x", [undefined, undefined])).toBe(false);
  });

  it("keeps every row when the query is blank or only spaces", () => {
    expect(matchesSearch("", [null])).toBe(true);
    expect(matchesSearch("   ", [null])).toBe(true);
  });

  it("matches case-insensitively across any one field", () => {
    expect(matchesSearch("KHACH", ["Test Khach A v2", "0911000002"])).toBe(true);
    expect(matchesSearch("0911", ["Test Khach A v2", "0911000002"])).toBe(true);
  });

  it("reads a non-string field rather than ignoring it", () => {
    expect(matchesSearch("42", [42])).toBe(true);
  });
});
