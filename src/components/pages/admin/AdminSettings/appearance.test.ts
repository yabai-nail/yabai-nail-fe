import { describe, expect, it } from "vitest";

import { APPEARANCES, selectedAppearance } from "./appearance";

/**
 * next-themes reads localStorage, so on the server `theme` is undefined and on the
 * client's very first render it already holds the stored value. Binding a radio
 * group straight to it would hydrate "system" on the server against "dark" on the
 * client and React would warn about the mismatched `checked`. These pin the rule
 * that keeps both renders identical: until hydration, the answer is always system.
 */
describe("selectedAppearance", () => {
  it("answers system until the browser has hydrated, whatever next-themes says", () => {
    expect(selectedAppearance("dark", false)).toBe("system");
  });

  it("follows the stored choice once hydrated", () => {
    expect(selectedAppearance("dark", true)).toBe("dark");
    expect(selectedAppearance("light", true)).toBe("light");
    expect(selectedAppearance("system", true)).toBe("system");
  });

  it("falls back to system for a missing or unknown value", () => {
    expect(selectedAppearance(undefined, true)).toBe("system");
    expect(selectedAppearance("sepia", true)).toBe("system");
  });

  it("offers exactly light, dark and system, in that order", () => {
    expect(APPEARANCES).toEqual(["light", "dark", "system"]);
  });
});
