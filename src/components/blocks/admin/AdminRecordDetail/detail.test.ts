import { describe, expect, it } from "vitest";
import { toDetailRows } from "./component";

describe("toDetailRows", () => {
  it("returns empty for undefined", () => {
    expect(toDetailRows(undefined)).toEqual([]);
  });

  it("stringifies primitives, dashes null, JSON-encodes objects", () => {
    const rows = toDetailRows({ a: 1, b: "x", c: null, d: { n: 2 }, e: [1, 2] });
    expect(rows).toEqual([
      { key: "a", value: "1" },
      { key: "b", value: "x" },
      { key: "c", value: "—" },
      { key: "d", value: '{"n":2}' },
      { key: "e", value: "[1,2]" },
    ]);
  });
});
