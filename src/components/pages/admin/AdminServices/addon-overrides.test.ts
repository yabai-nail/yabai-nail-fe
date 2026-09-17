import { describe, expect, it } from "vitest";

import { findInvalidAddonOverrides, type AddonDraft } from "./addon-groups";

const draft = (branches: Record<string, { priceOverride: string; durationOverride: string }>): AddonDraft => ({
  selected: true,
  branches: Object.fromEntries(
    Object.entries(branches).map(([id, value]) => [id, { enabled: true, ...value }]),
  ),
});

describe("findInvalidAddonOverrides", () => {
  it("accepts blank overrides, which mean the add-on keeps its own price and duration", () => {
    const drafts = { a1: draft({ b1: { priceOverride: "", durationOverride: "" } }) };

    expect(findInvalidAddonOverrides(drafts)).toEqual([]);
  });

  it("accepts any whole number of minutes, on no particular grid", () => {
    // 20 minutes used to be refused, by the form and then by a 422, because durations had to
    // be multiples of 15. Nothing downstream needed that: appointments store real instants and
    // overlap is compared on real intervals, so how long a treatment takes is the salon's call.
    for (const durationOverride of ["20", "25", "30", "1"]) {
      const drafts = { a1: draft({ b1: { priceOverride: "100", durationOverride } }) };

      expect(findInvalidAddonOverrides(drafts)).toEqual([]);
    }
  });

  it("still rejects a duration that is negative or not a number", () => {
    const drafts = {
      a1: draft({ b1: { priceOverride: "", durationOverride: "-15" } }),
      a2: draft({ b1: { priceOverride: "", durationOverride: "20.5" } }),
    };

    expect(findInvalidAddonOverrides(drafts)).toEqual([
      { addonId: "a1", branchId: "b1", field: "durationOverride" },
      { addonId: "a2", branchId: "b1", field: "durationOverride" },
    ]);
  });

  it("rejects a negative or non-numeric price", () => {
    const drafts = {
      a1: draft({ b1: { priceOverride: "-5", durationOverride: "" } }),
      a2: draft({ b1: { priceOverride: "abc", durationOverride: "" } }),
    };

    expect(findInvalidAddonOverrides(drafts)).toEqual([
      { addonId: "a1", branchId: "b1", field: "priceOverride" },
      { addonId: "a2", branchId: "b1", field: "priceOverride" },
    ]);
  });

  it("ignores rows for an add-on the service does not offer", () => {
    const drafts = { a1: { ...draft({ b1: { priceOverride: "", durationOverride: "20" } }), selected: false } };

    expect(findInvalidAddonOverrides(drafts)).toEqual([]);
  });
});
