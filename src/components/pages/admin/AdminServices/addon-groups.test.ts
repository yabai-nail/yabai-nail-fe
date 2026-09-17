import { describe, expect, it } from "vitest";

import {
  buildAddonGroups,
  createAddonDrafts,
  groupAddonCatalog,
  type AddonDraft,
} from "./addon-groups";
import type {
  AdminBranch,
  AdminServiceAddonGroup,
  AdminServiceItem,
} from "@/service";

const addon = (id: string, addonGroup: string | null, name = id): AdminServiceItem => ({
  id,
  name,
  price: 1000,
  durationMinutes: 30,
  serviceType: "ADD_ON",
  addonGroup,
  active: true,
  version: 1,
});

const branch = (id: string, name = id): AdminBranch =>
  ({ id, name, active: true, version: 1 }) as AdminBranch;

const branches = [branch("b1"), branch("b2")];

describe("groupAddonCatalog", () => {
  it("groups by the add-on's own group code and falls back to OTHER", () => {
    const grouped = groupAddonCatalog([
      addon("a1", "NAIL_REMOVAL"),
      addon("a2", null),
      addon("a3", "NAIL_REMOVAL"),
    ]);

    expect(grouped).toEqual([
      ["NAIL_REMOVAL", [addon("a1", "NAIL_REMOVAL"), addon("a3", "NAIL_REMOVAL")]],
      ["OTHER", [addon("a2", null)]],
    ]);
  });
});

describe("createAddonDrafts", () => {
  it("starts every add-on unselected and every branch enabled when nothing is configured", () => {
    const drafts = createAddonDrafts({
      addonCatalog: [addon("a1", "NAIL_REMOVAL")],
      branches,
      groups: [],
    });

    expect(drafts.a1.selected).toBe(false);
    expect(drafts.a1.branches).toEqual({
      b1: { enabled: true, priceOverride: "", durationOverride: "" },
      b2: { enabled: true, priceOverride: "", durationOverride: "" },
    });
  });

  it("marks a configured add-on selected and loads its per-branch overrides as text", () => {
    const groups: AdminServiceAddonGroup[] = [
      {
        code: "NAIL_REMOVAL",
        selectionMode: "SINGLE",
        required: false,
        minSelections: 0,
        maxSelections: 1,
        items: [
          {
            ruleId: "r1",
            addonServiceId: "a1",
            sortOrder: 0,
            addon: addon("a1", "NAIL_REMOVAL"),
            branches: [
              { branchId: "b1", enabled: false, priceOverride: 2000, durationOverride: 45 },
            ],
          },
        ],
      },
    ];

    const drafts = createAddonDrafts({
      addonCatalog: [addon("a1", "NAIL_REMOVAL")],
      branches,
      groups,
    });

    expect(drafts.a1.selected).toBe(true);
    expect(drafts.a1.branches.b1).toEqual({
      enabled: false,
      priceOverride: "2000",
      durationOverride: "45",
    });
    // A branch the rule has no row for keeps the "offered, no override" default.
    expect(drafts.a1.branches.b2).toEqual({
      enabled: true,
      priceOverride: "",
      durationOverride: "",
    });
  });
});

describe("buildAddonGroups", () => {
  const catalog = [
    addon("a1", "NAIL_REMOVAL"),
    addon("a2", "NAIL_REMOVAL"),
    addon("a3", "CHARM"),
  ];

  const drafts = (overrides: Record<string, Partial<AddonDraft>> = {}) => {
    const base = createAddonDrafts({ addonCatalog: catalog, branches, groups: [] });
    for (const [id, patch] of Object.entries(overrides)) {
      base[id] = { ...base[id], ...patch, branches: { ...base[id].branches, ...patch.branches } };
    }
    return base;
  };

  it("drops a group whose add-ons are all unselected", () => {
    expect(buildAddonGroups({ addonCatalog: catalog, branches, groups: [], drafts: drafts() })).toEqual([]);
  });

  it("numbers sortOrder within the group, not across the catalogue", () => {
    const built = buildAddonGroups({
      addonCatalog: catalog,
      branches,
      groups: [],
      drafts: drafts({ a2: { selected: true }, a3: { selected: true } }),
    });

    expect(built.map((group) => group.code)).toEqual(["NAIL_REMOVAL", "CHARM"]);
    expect(built[0].items).toEqual([
      {
        addonServiceId: "a2",
        sortOrder: 0,
        branches: [
          { branchId: "b1", enabled: true, priceOverride: null, durationOverride: null },
          { branchId: "b2", enabled: true, priceOverride: null, durationOverride: null },
        ],
      },
    ]);
    expect(built[1].items[0].sortOrder).toBe(0);
  });

  it("sends a blank override as null and a filled one as a number", () => {
    const built = buildAddonGroups({
      addonCatalog: catalog,
      branches,
      groups: [],
      drafts: drafts({
        a1: {
          selected: true,
          branches: {
            b1: { enabled: false, priceOverride: "2500", durationOverride: "" },
          },
        },
      }),
    });

    expect(built[0].items[0].branches[0]).toEqual({
      branchId: "b1",
      enabled: false,
      priceOverride: 2500,
      durationOverride: null,
    });
    expect(built[0].items[0].branches[1].priceOverride).toBeNull();
  });

  it("keeps a group SINGLE with maxSelections 1 when the server has no group yet", () => {
    const built = buildAddonGroups({
      addonCatalog: catalog,
      branches,
      groups: [],
      drafts: drafts({ a1: { selected: true }, a2: { selected: true } }),
    });

    expect(built[0]).toMatchObject({
      selectionMode: "SINGLE",
      required: false,
      minSelections: 0,
      maxSelections: 1,
    });
  });

  it("preserves an existing MULTIPLE group and widens maxSelections to the selection", () => {
    const existing: AdminServiceAddonGroup[] = [
      {
        code: "NAIL_REMOVAL",
        selectionMode: "MULTIPLE",
        required: false,
        minSelections: 0,
        maxSelections: 1,
        items: [],
      },
    ];

    const built = buildAddonGroups({
      addonCatalog: catalog,
      branches,
      groups: existing,
      drafts: drafts({ a1: { selected: true }, a2: { selected: true } }),
    });

    expect(built[0]).toMatchObject({ selectionMode: "MULTIPLE", maxSelections: 2 });
  });
});

describe("groupAddonCatalog on the screen service shape", () => {
  it("groups any row that carries an addonGroup, not just the catalogue DTO", () => {
    const rows = [
      { id: "s1", addonGroup: "NAIL_REMOVAL" },
      { id: "s2", addonGroup: null },
    ];

    expect(groupAddonCatalog(rows)).toEqual([
      ["NAIL_REMOVAL", [rows[0]]],
      ["OTHER", [rows[1]]],
    ]);
  });
});
