"use client";

import { useFormatter, useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { notifySuccess } from "@/lib/app-toast";
import { adminService, useAdminNotificationCampaignMetrics, useAdminNotificationCampaigns, useAdminPermission, useAdminPromotions } from "@/service";
import { IssueModal } from "./IssueModal";
import { PromotionModal } from "./PromotionModal";
import {
  adaptPromotion,
  campaignCanCancel,
  campaignStatusLabel,
  filterPromotions,
  formatDiscount,
  paginate,
  promotionStatuses,
  type PromotionRow,
} from "./data";

const pageSize = 8;
type Tab = "promotions" | "campaigns";
type ManagedCampaign = { readonly id: string; readonly name: string };

export function AdminMarketingComponent() {
  const t = useTranslations("admin.marketing");
  const tc = useTranslations("admin.common");
  const canReadPromotions = useAdminPermission("promotion.read.all");
  const canWritePromotions = useAdminPermission("promotion.write.all");
  const canPreviewCampaigns = useAdminPermission("campaign.preview.all");
  const canSendCampaigns = useAdminPermission("campaign.send.all");
  const statusLabel = (code: string) =>
    t.has(`promotionStatus.${code}`) ? t(`promotionStatus.${code}`) : code;
  const kindLabel = (code: string) =>
    t.has(`promotionKind.${code}`) ? t(`promotionKind.${code}`) : code;
  const [tab, setTab] = useState<Tab>(canReadPromotions ? "promotions" : "campaigns");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const { data, isLoading, error, mutate } = useAdminPromotions({
    q: query.trim() || undefined,
    status: status === "all" ? undefined : status,
  }, canReadPromotions);

  const source = useMemo<ReadonlyArray<PromotionRow>>(
    () => (data?.items ? data.items.map(adaptPromotion) : []),
    [data],
  );

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PromotionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [issuing, setIssuing] = useState<PromotionRow | null>(null);
  const [statusPending, setStatusPending] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [managedCampaign, setManagedCampaign] = useState<ManagedCampaign | null>(null);
  const campaigns = useAdminNotificationCampaigns(canSendCampaigns);
  const persistedCampaigns = (campaigns.data?.items ?? []).map((campaign) => ({
    id: campaign.campaignId,
    name: campaign.title ?? t("unnamedCampaign"),
  }));
  const currentCampaign = managedCampaign ?? persistedCampaigns[0] ?? null;

  /**
   * Nothing else in this screen can move a promotion off DRAFT, and issuance
   * refuses anything that is not ACTIVE — so every promotion created here used
   * to be permanently unissuable. Only `status` is sent: once a promotion is
   * ACTIVE the API rejects a patch that also carries code, value or dates.
   */
  async function toggleStatus(row: PromotionRow) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusPending(row.id);
    setStatusError(null);
    try {
      await adminService.updatePromotion(row.id, { status: next }, row.version);
      notifySuccess(next === "ACTIVE" ? tc("promotionActivated") : tc("promotionPaused"));
      void mutate();
    } catch (thrown) {
      setStatusError(thrown instanceof Error ? thrown.message : t("statusChangeFailed"));
    } finally {
      setStatusPending(null);
    }
  }

  const statuses = useMemo(
    () => Array.from(new Set(["ACTIVE", "DISABLED", "DRAFT", "EXPIRED", "INACTIVE", "PUBLISHED", "SCHEDULED", ...promotionStatuses(source)])),
    [source],
  );
  const filtered = useMemo(() => filterPromotions(source, status, query), [source, status, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex gap-1 border-b border-admin-border">
        {(["promotions", "campaigns"] as const).filter((value) => value === "promotions" ? canReadPromotions : canSendCampaigns).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`min-h-11 rounded-t-lg px-4 text-sm font-semibold ${
              tab === value ? "border-b-2 border-admin-accent text-admin-accent" : "text-admin-muted"
            }`}
          >
            {value === "promotions" ? t("tabs.promotions") : t("tabs.campaigns")}
          </button>
        ))}
      </div>

      {tab === "promotions" ? (
        <>
          <div className="mb-4 flex min-w-0 flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
              {t("columns.status")}
              <AdminSelectField
                label={t("filterLabel")}
                value={status}
                onChange={(value) => { setStatus(value); setPage(1); }}
                options={[
                  { value: "all", label: t("all") },
                  ...statuses.map((code) => ({ value: code, label: statusLabel(code) })),
                ]}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminSearchField label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
              <Button variant="primary" className="rounded-lg" isDisabled={!canWritePromotions} onPress={() => setCreating(true)}>
                <PlusIcon className="size-4" />{t("add")}
              </Button>
            </div>
          </div>

          {statusError ? (
            <p role="alert" className="mb-3 rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-danger">{statusError}</p>
          ) : null}

          {isLoading ? (
            <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
          ) : error ? (
            <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
          ) : null}

          <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Content className="min-w-0 overflow-x-auto p-0">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                    <th className="px-4 py-3">{t("columns.code")}</th>
                    <th className="px-4 py-3">{t("columns.name")}</th>
                    <th className="px-4 py-3">{t("columns.type")}</th>
                    <th className="px-4 py-3">{t("columns.value")}</th>
                    <th className="px-4 py-3">{t("columns.status")}</th>
                    <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-admin-muted">{t("empty")}</td></tr>
                  ) : (
                    visible.map((row) => (
                      <tr key={row.id} className="border-b border-admin-border last:border-0">
                        <td className="px-4 py-3 font-mono text-admin-ink">{row.code}</td>
                        <td className="px-4 py-3 text-admin-ink">{row.title}</td>
                        <td className="px-4 py-3 text-admin-muted">{kindLabel(row.type)}</td>
                        <td className="px-4 py-3 font-semibold text-admin-ink">{formatDiscount(row)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg" isDisabled={!canWritePromotions} onPress={() => setEditing(row)}>{t("edit")}</Button>
                            <Button size="sm" variant="outline" className="rounded-lg" isDisabled={!canWritePromotions || statusPending === row.id} onPress={() => void toggleStatus(row)}>
                              {row.status === "ACTIVE" ? t("promotionStatus.INACTIVE") : t("activate")}
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-lg" isDisabled={!canWritePromotions || row.status !== "ACTIVE"} onPress={() => setIssuing(row)}>{t("issue")}</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card.Content>
            <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
              <span>{t("pagination", { shown: visible.length, total: filtered.length })}</span>
              <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            </Card.Footer>
          </Card>
        </>
      ) : (
        <div className="space-y-4">
          {persistedCampaigns.length > 0 ? (
            <AdminSelectField
              label={t("campaignPickerLabel")}
              value={currentCampaign?.id ?? ""}
              onChange={(id) => setManagedCampaign(persistedCampaigns.find((campaign) => campaign.id === id) ?? null)}
              options={persistedCampaigns.map((campaign) => ({ value: campaign.id, label: campaign.name }))}
            />
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <CampaignPanel canPreview={canPreviewCampaigns} canSend={canSendCampaigns} onCreated={(campaign) => { setManagedCampaign(campaign); void campaigns.mutate(); }} />
            <CampaignManagePanel campaign={currentCampaign} canPreview={canPreviewCampaigns} canSend={canSendCampaigns} />
          </div>
        </div>
      )}

      {canWritePromotions && creating ? <PromotionModal promotion={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {canWritePromotions && editing ? <PromotionModal promotion={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
      {canWritePromotions && issuing ? <IssueModal promotionId={issuing.id} promotionName={issuing.title} onClose={() => setIssuing(null)} onIssued={() => void mutate()} /> : null}
    </AdminPageLayout>
  );
}

function CampaignPanel({ canPreview, canSend, onCreated }: Readonly<{ canPreview: boolean; canSend: boolean; onCreated: (campaign: ManagedCampaign) => void }>) {
  const t = useTranslations("admin.marketing");
  const tc = useTranslations("admin.common");
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("PUSH");
  const [template, setTemplate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const runPreview = async () => {
    setError(null);
    try {
      const result = await adminService.previewAudience({});
      setPreview(result.estimatedRecipients);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("previewFailed"));
    }
  };

  const createCampaign = async () => {
    if (name.trim().length < 2 || template.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const campaignName = name.trim();
      const campaign = await adminService.createNotificationCampaign({
        title: campaignName,
        channel,
        message: template.trim(),
      });
      onCreated({ id: campaign.campaignId, name: campaignName });
      notifySuccess(tc("campaignCreated"), tc("campaignStatus", { status: campaignStatusLabel(campaign.status, t) }));
      setName("");
      setTemplate("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("campaignCreateFailed"));
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";

  return (
    <Card className="max-w-xl gap-4 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">{t("createHeading")}</h2>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">{t("campaignName")}</span>
        <input disabled={!canSend} className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("campaignNamePlaceholder")} />
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">{t("channel")}</span>
        <AdminSelectField
          label={t("channelLabel")}
          fullWidth
          value={channel}
          isDisabled={!canSend}
          onChange={setChannel}
          options={[
            { value: "PUSH", label: "Push" },
            { value: "SMS", label: "SMS" },
            { value: "EMAIL", label: "Email" },
          ]}
        />
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">{t("template")}</span>
        <textarea disabled={!canSend} className="min-h-24 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink" value={template} onChange={(event) => setTemplate(event.target.value)} placeholder={t("templatePlaceholder")} />
      </label>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="rounded-lg" isDisabled={!canPreview} onPress={() => void runPreview()}>{t("previewAudience")}</Button>
        {preview !== null ? <span className="text-sm text-admin-muted">{t("matchingCustomers", { count: preview })}</span> : null}
      </div>
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={!canSend || busy || name.trim().length < 2 || template.trim().length < 2} onPress={() => void createCampaign()}>
          {busy ? t("creating") : t("createCampaign")}
        </Button>
      </div>
    </Card>
  );
}

function CampaignManagePanel({ campaign, canPreview, canSend }: Readonly<{ campaign: ManagedCampaign | null; canPreview: boolean; canSend: boolean }>) {
  const t = useTranslations("admin.marketing");
  const tc = useTranslations("admin.common");
  const format = useFormatter();
  const metrics = useAdminNotificationCampaignMetrics(campaign?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<number | null>(null);

  const cancel = async () => {
    if (!campaign) return;
    setBusy(true); setError(null);
    try {
      await adminService.cancelNotificationCampaign(campaign.id, undefined, metrics.data?.version);
      notifySuccess(tc("campaignCancelled"));
      void metrics.mutate();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("campaignCancelFailed"));
    } finally {
      setBusy(false);
    }
  };

  const previewAudience = async () => {
    setError(null);
    try {
      const result = await adminService.notificationCampaignAudiencePreview({});
      setAudience(result.estimatedRecipients);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("previewFailed"));
    }
  };

  const metricLabels: Record<string, string> = {
    status: t("columns.status"),
    estimatedRecipients: t("metrics.estimatedRecipients"),
    targetedCount: t("metrics.targetedCount"),
    processedRecipientCount: t("metrics.processedRecipientCount"),
    sentCount: t("metrics.sentCount"),
    deliveredCount: t("metrics.deliveredCount"),
    failedCount: t("metrics.failedCount"),
    inboxOnlyCount: t("metrics.inboxOnlyCount"),
    suppressedCount: t("metrics.suppressedCount"),
  };
  const metricRows = metrics.data
    ? Object.entries(metrics.data).filter(([key, value]) => key in metricLabels && (typeof value === "number" || typeof value === "string"))
    : [];

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">
        {campaign ? t("trackerTitle", { name: campaign.name }) : t("trackerEmptyTitle")}
      </h2>
      {!campaign ? <p className="text-xs text-admin-muted">{t("trackerEmptyBody")}</p> : null}
      {campaign ? (
        metrics.isLoading ? (
          <p className="text-xs text-admin-muted">{t("metricsLoading")}</p>
        ) : metrics.error ? (
          <p className="text-xs text-admin-danger">{t("metricsFailed")}</p>
        ) : metricRows.length > 0 ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {metricRows.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2 rounded-lg bg-admin-soft/50 px-3 py-1.5">
                <dt className="text-admin-muted">{metricLabels[key]}</dt>
                <dd className="font-semibold text-admin-ink">{key === "status" ? campaignStatusLabel(String(value), t) : format.number(Number(value))}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-admin-muted">{t("metricsEmpty")}</p>
        )
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="rounded-lg" isDisabled={!canPreview} onPress={() => void previewAudience()}>{t("previewAudience")}</Button>
        {audience !== null ? <span className="text-sm text-admin-muted">{t("customerCount", { count: audience })}</span> : null}
        {campaignCanCancel(metrics.data?.status) ? (
          <Button variant="ghost" className="rounded-lg text-admin-danger" isDisabled={!canSend || !campaign || !metrics.data?.version || busy} onPress={() => void cancel()}>{t("cancelCampaign")}</Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
    </Card>
  );
}

export const meta = { world: "connected", domain: "admin-marketing" } as const;
