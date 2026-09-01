import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, LOCALES, isLocale, pickLocale } from "./config";

describe("pickLocale", () => {
  it("takes the cookie when it names a locale the console ships", () => {
    expect(pickLocale("ja")).toBe("ja");
    expect(pickLocale("en")).toBe("en");
    expect(pickLocale("vi")).toBe("vi");
  });

  // Every one of these reaches the server as a plain string: no cookie on a first
  // visit, a cookie cleared to "", a locale we do not ship, or one hand-edited in
  // devtools. All of them have to answer Vietnamese rather than throw a render.
  it("falls back to the default for anything it does not ship", () => {
    for (const value of [undefined, null, "", "fr", "ja-JP", "VI", "  ja  "]) {
      expect(pickLocale(value)).toBe(DEFAULT_LOCALE);
    }
  });

  it("only ever answers a locale that has a catalogue", () => {
    expect(LOCALES).toContain(pickLocale("nonsense"));
  });
});

describe("isLocale", () => {
  it("narrows only exact matches", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("ja-JP")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
