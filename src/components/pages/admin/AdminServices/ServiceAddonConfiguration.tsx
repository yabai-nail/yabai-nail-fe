"use client";

import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { adminService, useAdminServiceAddons, type AdminServiceAddonConfiguration as AddonConfiguration, type AdminServiceItem } from "@/service";
import { notifySuccess } from "@/lib/app-toast";

type BranchDraft = { enabled: boolean; priceOverride: string; durationOverride: string };
type AddonDraft = { selected: boolean; branches: Record<string, BranchDraft> };

const numberOrNull = (value: string) => value.trim() === "" ? null : Number(value);

/** Maps reusable add-ons to one base service and configures branch-specific availability. */
export function ServiceAddonConfiguration({ serviceId, version }: Readonly<{ serviceId: string; version: number }>) {
  const t = useTranslations("admin.services.addons");
  const query = useAdminServiceAddons(serviceId);
  if (query.isLoading) return <p className="text-sm text-admin-muted">{t("loading")}</p>;
  if (query.error) return <p role="alert" className="text-sm text-admin-danger">{t("loadFailed")}</p>;
  if (!query.data?.addonCatalog.length) return <p className="rounded-xl border border-admin-border p-4 text-sm text-admin-muted">{t("empty")}</p>;
  return <ServiceAddonEditor key={`${serviceId}:${query.data.version}`} serviceId={serviceId} version={version} data={query.data} onMutate={query.mutate} />;
}

function ServiceAddonEditor({ serviceId, version, data, onMutate }: Readonly<{ serviceId: string; version: number; data: AddonConfiguration; onMutate: () => Promise<AddonConfiguration | undefined> }>) {
  const t = useTranslations("admin.services.addons");
  const [drafts, setDrafts] = useState<Record<string, AddonDraft>>(() => Object.fromEntries(data.addonCatalog.map((addon) => {
    const configured = data.groups.flatMap((group) => group.items).find((item) => item.addonServiceId === addon.id);
    return [addon.id, { selected: Boolean(configured), branches: Object.fromEntries(data.branches.map((branch) => {
      const current = configured?.branches.find((item) => item.branchId === branch.id);
      return [branch.id, { enabled: current?.enabled ?? true, priceOverride: current?.priceOverride == null ? "" : String(current.priceOverride), durationOverride: current?.durationOverride == null ? "" : String(current.durationOverride) }];
    })) }];
  })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const result = new Map<string, readonly AdminServiceItem[]>();
    for (const addon of data.addonCatalog) {
      const code = addon.addonGroup ?? "OTHER";
      result.set(code, [...(result.get(code) ?? []), addon]);
    }
    return [...result.entries()];
  }, [data.addonCatalog]);

  const updateBranch = (addonId: string, branchId: string, patch: Partial<BranchDraft>) => {
    setDrafts((current) => ({ ...current, [addonId]: { ...current[addonId], branches: { ...current[addonId]?.branches, [branchId]: { ...current[addonId]?.branches[branchId], ...patch } } } }));
  };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const groups = grouped.map(([code, addons]) => {
        const existing = data.groups.find((group) => group.code === code);
        const items = addons.filter((addon) => drafts[addon.id]?.selected).map((addon, sortOrder) => ({
          addonServiceId: addon.id,
          sortOrder,
          branches: data.branches.map((branch) => {
            const item = drafts[addon.id]?.branches[branch.id];
            return { branchId: branch.id, enabled: item?.enabled ?? true, priceOverride: numberOrNull(item?.priceOverride ?? ""), durationOverride: numberOrNull(item?.durationOverride ?? "") };
          }),
        }));
        return { code, selectionMode: existing?.selectionMode ?? "SINGLE" as const, required: false, minSelections: 0, maxSelections: existing?.selectionMode === "MULTIPLE" ? Math.max(1, items.length) : 1, items };
      }).filter((group) => group.items.length > 0);
      await adminService.updateServiceAddons(serviceId, { groups }, version);
      await onMutate();
      notifySuccess(t("success"));
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t("failed"));
    } finally { setBusy(false); }
  };

  return (
    <section className="grid gap-4 rounded-xl border border-admin-border p-4">
      <div><h3 className="font-bold text-admin-ink">{t("title")}</h3><p className="mt-1 text-xs text-admin-muted">{t("description")}</p></div>
      {grouped.map(([code, addons]) => (
        <fieldset key={code} className="grid gap-3 rounded-lg border border-admin-border p-3">
          <legend className="px-1 text-sm font-semibold text-admin-ink">{code}</legend>
          {addons.map((addon) => {
            const draft = drafts[addon.id];
            return <div key={addon.id} className="grid gap-3 rounded-lg bg-admin-soft p-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-admin-ink"><input type="checkbox" className="accent-admin-accent" checked={draft?.selected ?? false} onChange={(event) => setDrafts((current) => ({ ...current, [addon.id]: { ...current[addon.id], selected: event.target.checked } }))} />{addon.name} · ¥{addon.price}</label>
              {draft?.selected ? data.branches.map((branch) => {
                const branchDraft = draft.branches[branch.id];
                return <div key={branch.id} className="grid items-end gap-2 sm:grid-cols-[1fr_8rem_8rem]">
                  <label className="flex items-center gap-2 text-xs text-admin-ink"><input type="checkbox" className="accent-admin-accent" checked={branchDraft?.enabled ?? true} onChange={(event) => updateBranch(addon.id, branch.id, { enabled: event.target.checked })} />{branch.name}</label>
                  <label className="grid gap-1 text-xs text-admin-muted">{t("priceOverride")}<input inputMode="numeric" className="min-h-9 rounded-lg border border-admin-border bg-admin-surface px-2 text-admin-ink" value={branchDraft?.priceOverride ?? ""} onChange={(event) => updateBranch(addon.id, branch.id, { priceOverride: event.target.value })} /></label>
                  <label className="grid gap-1 text-xs text-admin-muted">{t("durationOverride")}<input type="number" min={0} step={15} className="min-h-9 rounded-lg border border-admin-border bg-admin-surface px-2 text-admin-ink" value={branchDraft?.durationOverride ?? ""} onChange={(event) => updateBranch(addon.id, branch.id, { durationOverride: event.target.value })} /></label>
                </div>;
              }) : null}
            </div>;
          })}
        </fieldset>
      ))}
      {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
      <Button variant="secondary" className="justify-self-end rounded-lg" isDisabled={busy} onPress={() => void save()}>{busy ? t("saving") : t("save")}</Button>
    </section>
  );
}
