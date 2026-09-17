"use client";

import { Button } from "@heroui/react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { adminService, useAdminServiceAddons, type AdminServiceAddonConfiguration as AddonConfiguration } from "@/service";
import { notifySuccess } from "@/lib/app-toast";

import { ServiceAddonFields, useAddonDrafts } from "./ServiceAddonFields";

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
  const { drafts, groupDrafts, toggleAddon, updateBranch, updateGroupRule, groups } = useAddonDrafts(data);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    try {
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
      <ServiceAddonFields
        addonCatalog={data.addonCatalog}
        branches={data.branches}
        drafts={drafts}
        groupDrafts={groupDrafts}
        onToggleAddon={toggleAddon}
        onUpdateBranch={updateBranch}
        onUpdateGroupRule={updateGroupRule}
      />
      {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
      <Button variant="secondary" className="justify-self-end rounded-lg" isDisabled={busy} onPress={() => void save()}>{busy ? t("saving") : t("save")}</Button>
    </section>
  );
}
