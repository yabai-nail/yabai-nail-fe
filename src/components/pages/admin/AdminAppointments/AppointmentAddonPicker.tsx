"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import { useAdminServiceAddons } from "@/service";
import type { AdminServiceAddonGroup, AdminServiceAddonRuleItem } from "@/service";

/**
 * Add-on ("dịch vụ bổ sung") selection for the appointment form. The customer booking flow
 * lets a base service carry add-ons; this brings the same to the admin counter form. Groups,
 * their rules (single/multiple, required, min/max) and per-branch price/duration come from
 * `GET /admin/services/{id}/add-ons`; the backend already accepts the resulting serviceIds and
 * prices them. Group and add-on names come from the config + locale, so no new i18n keys.
 */

export type AppointmentAddonSummary = Readonly<{
  ids: ReadonlyArray<string>;
  addedMinutes: number;
  addedPrice: number;
  complete: boolean;
}>;

function branchConfig(item: AdminServiceAddonRuleItem, branchId: string | null) {
  return branchId ? item.branches.find((branch) => branch.branchId === branchId) : undefined;
}

function itemPrice(item: AdminServiceAddonRuleItem, branchId: string | null): number {
  return branchConfig(item, branchId)?.priceOverride ?? item.addon.price;
}

function itemMinutes(item: AdminServiceAddonRuleItem, branchId: string | null): number {
  return branchConfig(item, branchId)?.durationOverride ?? item.addon.durationMinutes;
}

// A required group must have at least one pick even when minSelections is 0.
function requiredMin(group: AdminServiceAddonGroup): number {
  return group.required ? Math.max(1, group.minSelections) : group.minSelections;
}

export function AppointmentAddonPicker({
  serviceId,
  branchId,
  onChange,
}: Readonly<{
  serviceId: string;
  branchId: string | null;
  onChange: (summary: AppointmentAddonSummary) => void;
}>) {
  const locale = useLocale();
  const { data } = useAdminServiceAddons(serviceId || null);
  const [selected, setSelected] = useState<ReadonlyArray<string>>([]);

  // Only add-ons enabled at this branch; drop groups that end up empty.
  const groups = useMemo(() => {
    const source = data?.groups ?? [];
    return source
      .map((group) => ({ ...group, items: group.items.filter((item) => branchConfig(item, branchId)?.enabled ?? true) }))
      .filter((group) => group.items.length > 0);
  }, [data, branchId]);

  const summarise = useCallback(
    (ids: ReadonlyArray<string>): AppointmentAddonSummary => {
      let addedMinutes = 0;
      let addedPrice = 0;
      for (const group of groups) {
        for (const item of group.items) {
          if (ids.includes(item.addonServiceId)) {
            addedMinutes += itemMinutes(item, branchId);
            addedPrice += itemPrice(item, branchId);
          }
        }
      }
      const complete = groups.every((group) => {
        const count = group.items.filter((item) => ids.includes(item.addonServiceId)).length;
        const withinMax = group.maxSelections ? count <= group.maxSelections : true;
        return count >= requiredMin(group) && withinMax;
      });
      return { ids, addedMinutes, addedPrice, complete };
    },
    [groups, branchId],
  );

  // Keep the form's duration/price/validity in step with the current choice. Choices are reset
  // when the base service changes by remounting via `key` in the form, so no reset effect here.
  useEffect(() => {
    onChange(summarise(selected));
  }, [selected, summarise, onChange]);

  if (groups.length === 0) return null;

  const selectedSet = new Set(selected);

  const toggle = (group: (typeof groups)[number], addonServiceId: string) => {
    setSelected((current) => {
      const set = new Set(current);
      const groupIds = group.items.map((item) => item.addonServiceId);
      if (group.selectionMode === "SINGLE") {
        const without = current.filter((id) => !groupIds.includes(id));
        return set.has(addonServiceId) ? without : [...without, addonServiceId];
      }
      if (set.has(addonServiceId)) return current.filter((id) => id !== addonServiceId);
      const chosen = groupIds.filter((id) => set.has(id)).length;
      if (group.maxSelections && chosen >= group.maxSelections) return current; // group is at its cap
      return [...current, addonServiceId];
    });
  };

  const groupName = (group: (typeof groups)[number]) =>
    (locale === "ja" ? group.nameJa : group.nameVi) || group.nameVi || group.code;
  const addonName = (item: AdminServiceAddonRuleItem) =>
    (locale === "ja" ? item.addon.nameJa : item.addon.name) || item.addon.name;

  return (
    <div className="space-y-3 sm:col-span-2">
      {groups.map((group) => {
        const count = group.items.filter((item) => selectedSet.has(item.addonServiceId)).length;
        const unmet = count < requiredMin(group);
        return (
          <fieldset key={group.code} className="rounded-lg border border-admin-border p-3">
            <legend className="px-1 text-sm font-semibold text-admin-ink">
              {groupName(group)}
              {group.required ? <span className={unmet ? "text-admin-danger" : "text-admin-muted"}> *</span> : null}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.items.map((item) => {
                const active = selectedSet.has(item.addonServiceId);
                return (
                  <button
                    key={item.addonServiceId}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(group, item.addonServiceId)}
                    className={[
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "border-admin-accent bg-admin-soft text-admin-ink"
                        : "border-admin-border bg-admin-surface text-admin-ink hover:bg-admin-soft",
                    ].join(" ")}
                  >
                    <span className="min-w-0 flex-1 truncate font-normal">{addonName(item)}</span>
                    <span className="shrink-0 text-xs tabular-nums text-admin-muted">
                      {formatMoney(itemPrice(item, branchId))} · {itemMinutes(item, branchId)}′
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
