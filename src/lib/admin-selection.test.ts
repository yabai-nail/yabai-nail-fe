import { describe, expect, it } from "vitest";
import { resolveVisibleSelection } from "./admin-selection";

const records = [
  { id: "first", label: "First" },
  { id: "second", label: "Second" },
] as const;

describe("resolveVisibleSelection", () => {
  it("keeps the selected record when it remains visible", () => {
    expect(resolveVisibleSelection(records, "second")).toBe(records[1]);
  });

  it("falls back to the first visible record when the selection is filtered out", () => {
    expect(resolveVisibleSelection(records.slice(1), "first")).toBe(records[1]);
  });

  it("returns null when no records are visible", () => {
    expect(resolveVisibleSelection([], "first")).toBeNull();
  });
});
