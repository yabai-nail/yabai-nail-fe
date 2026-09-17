import { describe, expect, it } from "vitest";

import { shouldSeedAddonDrafts } from "./addon-groups";

const catalog = [{ id: "a1", addonGroup: "NAIL_REMOVAL" }];
const branches = [{ id: "b1" }];

describe("shouldSeedAddonDrafts", () => {
  it("seeds once both lists have arrived and nothing is drafted yet", () => {
    expect(shouldSeedAddonDrafts({ drafts: {}, addonCatalog: catalog, branches })).toBe(true);
  });

  it("never seeds over drafts that already exist", () => {
    // The regression this function exists for. In the create form the catalogue and the branch
    // list are separate requests, so the rows can render — and be ticked — before the branches
    // arrive. Seeding at that point wiped the tick, and because the built payload was then empty
    // the add-on request was never sent: no error, nothing saved.
    const drafts = { a1: { selected: true, branches: {} } };

    expect(shouldSeedAddonDrafts({ drafts, addonCatalog: catalog, branches })).toBe(false);
  });

  it("waits for the branch list so a row is never seeded without its branches", () => {
    expect(shouldSeedAddonDrafts({ drafts: {}, addonCatalog: catalog, branches: [] })).toBe(false);
  });

  it("has nothing to seed while the catalogue is empty", () => {
    expect(shouldSeedAddonDrafts({ drafts: {}, addonCatalog: [], branches })).toBe(false);
  });
});
