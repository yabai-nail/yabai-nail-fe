"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { AdminBranch, AdminServiceAddonGroup, AdminServiceItem } from "@/service";

import {
  buildAddonGroups,
  createAddonDrafts,
  createAddonGroupDrafts,
  findInvalidAddonOverrides,
  groupAddonCatalog,
  shouldSeedAddonDrafts,
  type AddonBranchDraft,
  type AddonDraft,
  type AddonGroupDraft,
  type AddonOverrideProblem,
  type AddonSource,
} from "./addon-groups";

/** A base service that has no mapping yet — the create form's starting point. */
export const NO_ADDON_GROUPS: ReadonlyArray<AdminServiceAddonGroup> = [];

/**
 * Owns the editable add-on selection and hands back the exact `PUT .../add-ons` body.
 *
 * The caller decides when that body is sent, which is the whole reason this is a hook: the
 * edit modal PUTs it on its own button, while the create modal cannot PUT anything until the
 * service it belongs to exists, so it holds the body until after the POST.
 *
 * Drafts are seeded once. Callers that need to reset them on fresh server data re-key the
 * component instead, so an in-flight edit is never clobbered by a revalidation.
 */
export function useAddonDrafts(source: AddonSource) {
  const { addonCatalog, branches, groups } = source;
  const [drafts, setDrafts] = useState<Record<string, AddonDraft>>(() =>
    createAddonDrafts(source),
  );
  const [groupDrafts, setGroupDrafts] = useState<Record<string, AddonGroupDraft>>(() =>
    createAddonGroupDrafts(source),
  );
  // Seeding is driven by the drafts themselves rather than by a one-shot flag: a flag still
  // allowed a seed to land after the first tick, which silently discarded it.
  if (shouldSeedAddonDrafts({ drafts, addonCatalog, branches })) {
    setDrafts(createAddonDrafts(source));
    setGroupDrafts(createAddonGroupDrafts(source));
  }

  const toggleAddon = useCallback((addonId: string, selected: boolean) => {
    setDrafts((current) => ({ ...current, [addonId]: { ...current[addonId], selected } }));
  }, []);

  const updateBranch = useCallback(
    (addonId: string, branchId: string, patch: Partial<AddonBranchDraft>) => {
      setDrafts((current) => ({
        ...current,
        [addonId]: {
          ...current[addonId],
          branches: {
            ...current[addonId]?.branches,
            [branchId]: { ...current[addonId]?.branches[branchId], ...patch },
          },
        },
      }));
    },
    [],
  );

  const updateGroupRule = useCallback((code: string, patch: Partial<AddonGroupDraft>) => {
    setGroupDrafts((current) => {
      // A group the seed has not reached yet still has to be editable, so it falls back to the
      // same permissive default the builder uses.
      const base: AddonGroupDraft = current[code] ?? { selectionMode: "SINGLE", required: false };
      return { ...current, [code]: { ...base, ...patch } };
    });
  }, []);

  const builtGroups = useMemo(
    () => buildAddonGroups({ addonCatalog, branches, groups, drafts, groupDrafts }),
    [addonCatalog, branches, groups, drafts, groupDrafts],
  );
  const overrideProblems = useMemo(() => findInvalidAddonOverrides(drafts), [drafts]);

  return {
    drafts,
    groupDrafts,
    overrideProblems,
    toggleAddon,
    updateBranch,
    updateGroupRule,
    groups: builtGroups,
  };
}

type ServiceAddonFieldsProps = Readonly<{
  addonCatalog: ReadonlyArray<AdminServiceItem>;
  branches: ReadonlyArray<AdminBranch>;
  drafts: Record<string, AddonDraft>;
  groupDrafts: Record<string, AddonGroupDraft>;
  overrideProblems: ReadonlyArray<AddonOverrideProblem>;
  onToggleAddon: (addonId: string, selected: boolean) => void;
  onUpdateBranch: (addonId: string, branchId: string, patch: Partial<AddonBranchDraft>) => void;
  onUpdateGroupRule: (code: string, patch: Partial<AddonGroupDraft>) => void;
}>;

/** The add-on selection itself: which add-ons this service offers, and where. */
export function ServiceAddonFields({
  addonCatalog,
  branches,
  drafts,
  groupDrafts,
  overrideProblems,
  onToggleAddon,
  onUpdateBranch,
  onUpdateGroupRule,
}: ServiceAddonFieldsProps) {
  const t = useTranslations("admin.services.addons");
  const grouped = useMemo(() => groupAddonCatalog(addonCatalog), [addonCatalog]);
  const isInvalid = (addonId: string, branchId: string, field: AddonOverrideProblem["field"]) =>
    overrideProblems.some(
      (problem) => problem.addonId === addonId && problem.branchId === branchId && problem.field === field,
    );
  const fieldClass = (invalid: boolean) =>
    `min-h-9 w-full rounded-lg border bg-admin-surface px-2 text-admin-ink ${invalid ? "border-admin-danger" : "border-admin-border"}`;

  return (
    <>
      {grouped.map(([code, addons]) => (
        <fieldset key={code} className="grid gap-3 rounded-lg border border-admin-border p-3">
          <legend className="px-1 font-mono text-xs font-semibold text-admin-muted">{code}</legend>
          {/* How the customer answers this group. The two controls stand in for four stored
              numbers: the request body's min/max are derived from them, so an admin cannot
              save a combination the backend refuses. */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-admin-soft px-3 py-2">
            <label className="flex items-center gap-2 text-xs text-admin-ink">
              <span className="font-semibold">{t("selectionMode")}</span>
              <select
                className="min-h-9 rounded-lg border border-admin-border bg-admin-surface px-2 text-admin-ink"
                value={groupDrafts[code]?.selectionMode ?? "SINGLE"}
                onChange={(event) => onUpdateGroupRule(code, { selectionMode: event.target.value as AddonGroupDraft["selectionMode"] })}
              >
                <option value="SINGLE">{t("selectionSingle")}</option>
                <option value="MULTIPLE">{t("selectionMultiple")}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-admin-ink">
              <input
                type="checkbox"
                className="accent-admin-accent"
                checked={groupDrafts[code]?.required ?? false}
                onChange={(event) => onUpdateGroupRule(code, { required: event.target.checked })}
              />
              <span className="font-semibold">{t("required")}</span>
            </label>
            <span className="text-xs text-admin-muted">{t(groupDrafts[code]?.required ? "requiredHint" : "optionalHint")}</span>
          </div>
          {addons.map((addon) => {
            const draft = drafts[addon.id];
            return <div key={addon.id} className="grid gap-3 rounded-lg bg-admin-soft p-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-admin-ink">
                <input type="checkbox" className="accent-admin-accent" checked={draft?.selected ?? false} onChange={(event) => onToggleAddon(addon.id, event.target.checked)} />
                {/* The add-on's own photo, so the row is recognised by sight and matches what the
                    customer will be shown for it; the tab and the app draw the same image. */}
                {addon.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={addon.imageUrl} alt="" className="size-9 shrink-0 rounded-lg border border-admin-border object-cover" />
                ) : (
                  <span aria-hidden="true" className="size-9 shrink-0 rounded-lg border border-admin-border bg-admin-surface" />
                )}
                <span>{addon.name} · ¥{addon.price}</span>
              </label>
              {draft?.selected ? (
                <div className="grid max-w-2xl gap-2">
                  {/* One header for the whole branch list. The two field captions used to sit
                      inside every row, so a four-branch salon read them eight times per add-on. */}
                  <div className="hidden gap-3 px-1 text-xs font-semibold text-admin-muted sm:grid sm:grid-cols-[minmax(0,1fr)_8rem_8rem]">
                    <span>{t("branchColumn")}</span>
                    <span>{t("priceOverride")}</span>
                    <span>{t("durationOverride")}</span>
                  </div>
                  {branches.map((branch) => {
                    const branchDraft = draft.branches?.[branch.id];
                    return <div key={branch.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_8rem] sm:items-center sm:gap-3">
                      <label className="flex items-center gap-2 text-xs text-admin-ink"><input type="checkbox" className="accent-admin-accent" checked={branchDraft?.enabled ?? true} onChange={(event) => onUpdateBranch(addon.id, branch.id, { enabled: event.target.checked })} /><span className="min-w-0 truncate">{branch.name}</span></label>
                      {/* `w-full` with a `minmax(0,...)` track is what keeps the field inside its
                          column: a grid item defaults to min-width:auto, and an input's intrinsic
                          width is about 170px, so an 8rem track used to overflow the card instead
                          of squeezing. `sm:contents` drops this wrapper at desktop width so the
                          input lands in the row grid under its header; below sm the caption
                          returns above the field, where there is no header to read. */}
                      <label className="grid gap-1 text-xs text-admin-muted sm:contents"><span className="sm:hidden">{t("priceOverride")}</span><input inputMode="numeric" aria-label={`${t("priceOverride")} - ${branch.name}`} aria-invalid={isInvalid(addon.id, branch.id, "priceOverride")} className={fieldClass(isInvalid(addon.id, branch.id, "priceOverride"))} value={branchDraft?.priceOverride ?? ""} onChange={(event) => onUpdateBranch(addon.id, branch.id, { priceOverride: event.target.value })} /></label>
                      <label className="grid gap-1 text-xs text-admin-muted sm:contents"><span className="sm:hidden">{t("durationOverride")}</span><input type="number" min={0} step={1} aria-label={`${t("durationOverride")} - ${branch.name}`} aria-invalid={isInvalid(addon.id, branch.id, "durationOverride")} className={fieldClass(isInvalid(addon.id, branch.id, "durationOverride"))} value={branchDraft?.durationOverride ?? ""} onChange={(event) => onUpdateBranch(addon.id, branch.id, { durationOverride: event.target.value })} /></label>
                    </div>;
                  })}
                </div>
              ) : null}
            </div>;
          })}
        </fieldset>
      ))}
    </>
  );
}
