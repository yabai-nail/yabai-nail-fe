import type {
  AdminBranch,
  AdminServiceAddonConfigurationInput,
  AdminServiceAddonGroup,
  AdminServiceItem,
} from "@/service";

export type AddonBranchDraft = {
  readonly enabled: boolean;
  readonly priceOverride: string;
  readonly durationOverride: string;
};

export type AddonDraft = {
  readonly selected: boolean;
  readonly branches: Record<string, AddonBranchDraft>;
};

/**
 * The two questions a salon actually answers about a group. The backend also stores
 * `minSelections` and `maxSelections`, but it rejects any combination that disagrees with
 * these two flags, so the console derives those numbers rather than offering four fields that
 * can contradict each other.
 */
export type AddonGroupDraft = {
  readonly selectionMode: "SINGLE" | "MULTIPLE";
  readonly required: boolean;
};

export type AddonSource = {
  readonly addonCatalog: ReadonlyArray<AdminServiceItem>;
  readonly branches: ReadonlyArray<AdminBranch>;
  readonly groups: ReadonlyArray<AdminServiceAddonGroup>;
};

/** Group code fallback for an add-on service created without one. */
const UNGROUPED = "OTHER";

const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

const overrideText = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

/**
 * Buckets the reusable add-ons by group.
 *
 * The group lives on the add-on service itself (`addonGroup`), not on the mapping, which is
 * why one add-on cannot sit in different groups under two different base services even
 * though the backend rule key allows it. Keeping the derivation here, rather than inline in
 * a component, is what let it be tested and is where that limitation would be lifted.
 */
export function groupAddonCatalog<T extends { readonly addonGroup?: string | null }>(
  addonCatalog: ReadonlyArray<T>,
): ReadonlyArray<readonly [string, ReadonlyArray<T>]> {
  const grouped = new Map<string, T[]>();
  for (const addon of addonCatalog) {
    const code = addon.addonGroup ?? UNGROUPED;
    grouped.set(code, [...(grouped.get(code) ?? []), addon]);
  }
  return [...grouped.entries()];
}

/**
 * Seeds one editable row per add-on in the catalogue, whether or not this base service
 * already maps it. A branch the stored rule has no row for reads as "offered here, no
 * override", which is the same default the backend applies when the row is absent.
 *
 * Overrides are held as strings because they are bound to text inputs: an empty field has to
 * survive a render as an empty field, and `0` and "" are different answers.
 */
export function createAddonDrafts({
  addonCatalog,
  branches,
  groups,
}: AddonSource): Record<string, AddonDraft> {
  const configuredItems = groups.flatMap((group) => group.items);
  return Object.fromEntries(
    addonCatalog.map((addon) => {
      const configured = configuredItems.find((item) => item.addonServiceId === addon.id);
      return [
        addon.id,
        {
          selected: Boolean(configured),
          branches: Object.fromEntries(
            branches.map((branch) => {
              const current = configured?.branches.find((item) => item.branchId === branch.id);
              return [
                branch.id,
                {
                  enabled: current?.enabled ?? true,
                  priceOverride: overrideText(current?.priceOverride),
                  durationOverride: overrideText(current?.durationOverride),
                },
              ];
            }),
          ),
        },
      ];
    }),
  );
}

export type AddonOverrideProblem = {
  readonly addonId: string;
  readonly branchId: string;
  readonly field: "priceOverride" | "durationOverride";
};

/**
 * The branch overrides the backend would refuse, checked before anything is sent.
 *
 * It mirrors the server's own rules — both numbers whole and non-negative — because the
 * alternative is a 422 that arrives after the service has been created and names neither the
 * branch nor the field. There is deliberately no grid: how long a treatment takes is the
 * salon's call, and nothing downstream needs the minutes to land on a multiple.
 *
 * Blank stays blank: an empty override means the add-on keeps its own numbers.
 */
export function findInvalidAddonOverrides(
  drafts: Record<string, AddonDraft>,
): ReadonlyArray<AddonOverrideProblem> {
  const problems: AddonOverrideProblem[] = [];
  for (const [addonId, draft] of Object.entries(drafts)) {
    if (!draft?.selected) continue;
    for (const [branchId, branch] of Object.entries(draft.branches ?? {})) {
      const price = branch.priceOverride.trim();
      if (price !== "" && (!Number.isInteger(Number(price)) || Number(price) < 0)) {
        problems.push({ addonId, branchId, field: "priceOverride" });
      }
      const duration = branch.durationOverride.trim();
      if (duration !== "" && (!Number.isInteger(Number(duration)) || Number(duration) < 0)) {
        problems.push({ addonId, branchId, field: "durationOverride" });
      }
    }
  }
  return problems;
}

/**
 * Whether the editable drafts still have to be seeded from the server payload.
 *
 * A caller can mount before its data has arrived — the create form does, because it reads the
 * add-on catalogue and the branch list as two separate requests rather than through the
 * per-service endpoint. Both conditions matter:
 *
 * - Nothing may be seeded over drafts that already exist. The rows render as soon as the
 *   catalogue lands, so an add-on can be ticked while the branches are still in flight;
 *   re-seeding then discarded the tick, and the built payload went back to empty, so the
 *   add-on request was never sent at all — nothing saved and nothing reported.
 * - Nothing is seeded until the branches are known either, so a row is never seeded with an
 *   empty set of branches and left that way.
 */
export function shouldSeedAddonDrafts({
  drafts,
  addonCatalog,
  branches,
}: {
  readonly drafts: Record<string, unknown>;
  readonly addonCatalog: ReadonlyArray<unknown>;
  readonly branches: ReadonlyArray<unknown>;
}): boolean {
  return Object.keys(drafts).length === 0 && addonCatalog.length > 0 && branches.length > 0;
}

/** Seeds one editable rule per group, from what the server stored or a permissive default. */
export function createAddonGroupDrafts({
  addonCatalog,
  groups,
}: Pick<AddonSource, "addonCatalog" | "groups">): Record<string, AddonGroupDraft> {
  return Object.fromEntries(
    groupAddonCatalog(addonCatalog).map(([code]) => {
      const stored = groups.find((group) => group.code === code);
      return [
        code,
        {
          selectionMode: stored?.selectionMode ?? "SINGLE",
          required: stored?.required ?? false,
        },
      ];
    }),
  );
}

/**
 * The selection bounds the backend will accept for one group.
 *
 * Its rules: an optional group must send exactly 0 as its minimum, a required one at least 1,
 * a SINGLE group exactly 1 as its maximum, and no maximum may exceed the number of add-ons in
 * the group. Deriving them here is what keeps those four constraints satisfied by
 * construction instead of by the admin guessing.
 */
function selectionBounds(rule: AddonGroupDraft, itemCount: number) {
  const minSelections = rule.required ? 1 : 0;
  return {
    minSelections,
    maxSelections: rule.selectionMode === "SINGLE" ? 1 : Math.max(1, itemCount),
  };
}

/**
 * Turns the drafts into the `PUT /admin/services/{id}/add-ons` body.
 *
 * A group with nothing selected is dropped rather than sent empty: the backend rejects a
 * group with no items, and an unmapped group is exactly how an add-on is removed from this
 * base service. The group's own rule comes from `groupDrafts`, falling back to whatever the
 * server stored, so a caller that does not edit group rules keeps the stored behaviour.
 */
export function buildAddonGroups({
  addonCatalog,
  branches,
  groups,
  drafts,
  groupDrafts = {},
}: AddonSource & {
  readonly drafts: Record<string, AddonDraft>;
  readonly groupDrafts?: Record<string, AddonGroupDraft>;
}): AdminServiceAddonConfigurationInput["groups"] {
  return groupAddonCatalog(addonCatalog)
    .map(([code, addons]) => {
      const stored = groups.find((group) => group.code === code);
      const rule: AddonGroupDraft = groupDrafts[code] ?? {
        selectionMode: stored?.selectionMode ?? "SINGLE",
        required: stored?.required ?? false,
      };
      const items = addons
        .filter((addon) => drafts[addon.id]?.selected)
        .map((addon, sortOrder) => ({
          addonServiceId: addon.id,
          sortOrder,
          branches: branches.map((branch) => {
            const item = drafts[addon.id]?.branches?.[branch.id];
            return {
              branchId: branch.id,
              enabled: item?.enabled ?? true,
              priceOverride: numberOrNull(item?.priceOverride ?? ""),
              durationOverride: numberOrNull(item?.durationOverride ?? ""),
            };
          }),
        }));
      // No group name is sent: nothing in the console edits one, and an omitted field leaves
      // whatever the server already stores instead of clearing it.
      return {
        code,
        selectionMode: rule.selectionMode,
        required: rule.required,
        ...selectionBounds(rule, items.length),
        items,
      };
    })
    .filter((group) => group.items.length > 0);
}
