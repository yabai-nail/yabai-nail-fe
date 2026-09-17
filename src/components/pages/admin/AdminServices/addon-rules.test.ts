import { describe, expect, it } from "vitest";

import {
  buildAddonGroups,
  createAddonDrafts,
  createAddonGroupDrafts,
  type AddonGroupDraft,
} from "./addon-groups";
import type { AdminBranch, AdminServiceAddonGroup, AdminServiceItem } from "@/service";

const addon = (id: string, addonGroup: string | null): AdminServiceItem => ({
  id,
  name: id,
  price: 1000,
  durationMinutes: 30,
  serviceType: "ADD_ON",
  addonGroup,
  active: true,
  version: 1,
});

const branch = (id: string): AdminBranch => ({ id, name: id, active: true, version: 1 }) as AdminBranch;

const catalog = [addon("a1", "REMOVAL"), addon("a2", "REMOVAL"), addon("a3", "CHARM")];
const branches = [branch("b1")];

const group = (over: Partial<AdminServiceAddonGroup> = {}): AdminServiceAddonGroup => ({
  code: "REMOVAL",
  selectionMode: "SINGLE",
  required: false,
  minSelections: 0,
  maxSelections: 1,
  items: [],
  ...over,
});

describe("createAddonGroupDrafts", () => {
  it("offers one editable rule per group in the catalogue", () => {
    const drafts = createAddonGroupDrafts({ addonCatalog: catalog, groups: [] });

    expect(drafts).toEqual({
      REMOVAL: { selectionMode: "SINGLE", required: false },
      CHARM: { selectionMode: "SINGLE", required: false },
    });
  });

  it("loads what the server already stored for a group", () => {
    const drafts = createAddonGroupDrafts({
      addonCatalog: catalog,
      groups: [group({ selectionMode: "MULTIPLE", required: true, minSelections: 1, maxSelections: 2 })],
    });

    expect(drafts.REMOVAL).toEqual({ selectionMode: "MULTIPLE", required: true });
  });
});

describe("buildAddonGroups with editable group rules", () => {
  const build = (groupDrafts: Record<string, AddonGroupDraft>) => {
    const drafts = createAddonDrafts({ addonCatalog: catalog, branches, groups: [] });
    for (const id of ["a1", "a2"]) drafts[id] = { ...drafts[id], selected: true };
    return buildAddonGroups({
      addonCatalog: catalog,
      branches,
      groups: [],
      drafts,
      groupDrafts,
    });
  };

  // The backend rejects a group whose numbers disagree with its flags, so the two controls the
  // console exposes derive them instead of asking the admin for four values that can conflict.
  it("an optional SINGLE group allows picking nothing", () => {
    expect(build({ REMOVAL: { selectionMode: "SINGLE", required: false } })[0]).toMatchObject({
      selectionMode: "SINGLE",
      required: false,
      minSelections: 0,
      maxSelections: 1,
    });
  });

  it("a required SINGLE group demands exactly one", () => {
    expect(build({ REMOVAL: { selectionMode: "SINGLE", required: true } })[0]).toMatchObject({
      required: true,
      minSelections: 1,
      maxSelections: 1,
    });
  });

  it("a MULTIPLE group tops out at however many add-ons it offers", () => {
    expect(build({ REMOVAL: { selectionMode: "MULTIPLE", required: false } })[0]).toMatchObject({
      selectionMode: "MULTIPLE",
      minSelections: 0,
      maxSelections: 2,
    });
  });

  it("a required MULTIPLE group demands at least one", () => {
    expect(build({ REMOVAL: { selectionMode: "MULTIPLE", required: true } })[0]).toMatchObject({
      minSelections: 1,
      maxSelections: 2,
    });
  });

  it("falls back to an optional single choice for a group with no rule drafted", () => {
    expect(build({})[0]).toMatchObject({ selectionMode: "SINGLE", required: false, minSelections: 0, maxSelections: 1 });
  });
});
