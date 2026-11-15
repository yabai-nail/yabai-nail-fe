"use client";

import { useTranslations } from "next-intl";

import { SaleItemPicker } from "./SaleItemPicker";
import type { SaleFormScope, SaleOptionsStatus, SaleTarget } from "./data";

export type SaleGroupOption = { readonly id: string; readonly label: string };

/** Stands in for a list that is still loading or failed, so nothing reads as "none yet". */
export function SaleOptionsNotice({ status }: Readonly<{ status: Exclude<SaleOptionsStatus, "ready"> }>) {
  const t = useTranslations("admin.sales");
  return status === "loading" ? (
    <p role="status" className="text-xs text-admin-muted">{t("optionsLoading")}</p>
  ) : (
    <p role="alert" className="text-xs text-admin-danger">{t("optionsFailed")}</p>
  );
}

const MODES = ["NONE", "ALL", "GROUPS", "ITEMS"] as const;

// The two blocks differ only in their words: tiers and designs, or categories and services.
const COPY = {
  designs: {
    legend: "form.designs",
    modes: "form.designModes",
    all: "form.allDesigns",
    groups: "form.tiersLabel",
    noGroups: "form.noTiers",
    pick: "form.pickDesigns",
    search: "form.searchDesigns",
    noItems: "form.noDesigns",
  },
  services: {
    legend: "form.services",
    modes: "form.serviceModes",
    all: "form.allServices",
    groups: "form.categoriesLabel",
    noGroups: "form.noCategories",
    pick: "form.pickServices",
    search: "form.searchServices",
    noItems: "form.noServices",
  },
} as const;

/**
 * One "Áp dụng cho" block: Không áp dụng / Tất cả / by tier or category / pick each item.
 * Switching mode keeps the other mode's picks, so trying a mode loses nothing.
 */
export function SaleScopeFields({
  kind,
  value,
  onChange,
  groups,
  items,
  groupsStatus,
  itemsStatus,
}: Readonly<{
  kind: keyof typeof COPY;
  value: SaleFormScope;
  onChange: (next: SaleFormScope) => void;
  groups: ReadonlyArray<SaleGroupOption>;
  items: ReadonlyArray<SaleTarget>;
  groupsStatus: SaleOptionsStatus;
  itemsStatus: SaleOptionsStatus;
}>) {
  const t = useTranslations("admin.sales");
  const copy = COPY[kind];
  const groupIds = new Set(value.groupIds);
  const toggleGroup = (id: string) => {
    const next = new Set(groupIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...value, groupIds: [...next] });
  };

  return (
    <fieldset className="grid min-w-0 gap-3 text-sm">
      <legend className="mb-2 font-semibold text-admin-ink">{t(copy.legend)}</legend>
      <div role="group" aria-label={t(copy.legend)} className="grid grid-cols-2 rounded-lg border border-admin-border bg-admin-surface p-0.5 sm:flex sm:w-fit sm:max-w-full sm:flex-wrap">
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value.mode === mode}
            onClick={() => onChange({ ...value, mode })}
            className={`min-h-11 rounded-md px-2 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${
              value.mode === mode ? "bg-admin-accent text-admin-on-accent" : "text-admin-muted hover:text-admin-ink"
            }`}
          >
            {t(`${copy.modes}.${mode}`)}
          </button>
        ))}
      </div>

      {value.mode === "ALL" ? (
        itemsStatus === "ready" ? (
          <p className="text-xs leading-5 text-admin-muted">{t(copy.all, { count: items.length })}</p>
        ) : (
          <SaleOptionsNotice status={itemsStatus} />
        )
      ) : value.mode === "GROUPS" ? (
        groupsStatus !== "ready" ? (
          <SaleOptionsNotice status={groupsStatus} />
        ) : groups.length === 0 ? (
          <p role="status" className="text-xs text-admin-muted">{t(copy.noGroups)}</p>
        ) : (
          <fieldset className="grid min-w-0 gap-2 rounded-lg border border-admin-border p-3">
            <legend className="px-1 text-xs font-semibold text-admin-muted">{t(copy.groups)}</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {groups.map((group) => (
                <label key={group.id} className="flex items-center gap-2 text-sm text-admin-ink">
                  <input
                    type="checkbox"
                    className="size-4 accent-admin-accent"
                    checked={groupIds.has(group.id)}
                    onChange={() => toggleGroup(group.id)}
                  />
                  {group.label}
                </label>
              ))}
            </div>
          </fieldset>
        )
      ) : value.mode === "ITEMS" ? (
        itemsStatus !== "ready" ? (
          <SaleOptionsNotice status={itemsStatus} />
        ) : (
          <SaleItemPicker
            label={t(copy.pick)}
            searchLabel={t(copy.search)}
            emptyText={t(copy.noItems)}
            items={items}
            selected={value.itemIds}
            onChange={(itemIds) => onChange({ ...value, itemIds })}
          />
        )
      ) : null}
    </fieldset>
  );
}
