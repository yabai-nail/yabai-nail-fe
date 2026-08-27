"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { adminService, useAdminNotificationCampaignMetrics, useAdminNotificationCampaigns, useAdminPromotions } from "@/service";
import { IssueModal } from "./IssueModal";
import { PromotionModal } from "./PromotionModal";
import {
  adaptPromotion,
  campaignCanCancel,
  campaignStatusLabel,
  filterPromotions,
  formatDiscount,
  paginate,
  promotionKindLabels,
  promotionStatusLabels,
  promotionStatuses,
  type PromotionRow,
} from "./data";

const pageSize = 8;
type Tab = "promotions" | "campaigns";
type ManagedCampaign = { readonly id: string; readonly name: string };

export function AdminMarketingComponent() {
  const [tab, setTab] = useState<Tab>("promotions");
  const { data, isLoading, error, mutate } = useAdminPromotions();

  const source = useMemo<ReadonlyArray<PromotionRow>>(
    () => (data?.items ? data.items.map(adaptPromotion) : []),
    [data],
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PromotionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [issuing, setIssuing] = useState<PromotionRow | null>(null);
  const [statusPending, setStatusPending] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [managedCampaign, setManagedCampaign] = useState<ManagedCampaign | null>(null);
  const campaigns = useAdminNotificationCampaigns();
  const persistedCampaigns = (campaigns.data?.items ?? []).map((campaign) => ({
    id: campaign.campaignId,
    name: campaign.title ?? "Chiến dịch chưa có tên",
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
      void mutate();
    } catch (thrown) {
      setStatusError(thrown instanceof Error ? thrown.message : "Không đổi được trạng thái.");
    } finally {
      setStatusPending(null);
    }
  }

  const statuses = useMemo(() => promotionStatuses(source), [source]);
  const filtered = useMemo(() => filterPromotions(source, status, query), [source, status, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex gap-1 border-b border-admin-border">
        {(["promotions", "campaigns"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`min-h-11 rounded-t-lg px-4 text-sm font-semibold ${
              tab === value ? "border-b-2 border-admin-accent text-admin-accent" : "text-admin-muted"
            }`}
          >
            {value === "promotions" ? "Khuyến mãi" : "Chiến dịch"}
          </button>
        ))}
      </div>

      {tab === "promotions" ? (
        <>
          <div className="mb-4 flex min-w-0 flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
              Trạng thái
              <AdminSelectField
                label="Lọc theo trạng thái khuyến mãi"
                value={status}
                onChange={(value) => { setStatus(value); setPage(1); }}
                options={[
                  { value: "all", label: "Tất cả" },
                  ...statuses.map((code) => ({ value: code, label: promotionStatusLabels[code] ?? code })),
                ]}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminSearchField label="Tìm khuyến mãi" placeholder="Mã hoặc tên..." value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
              <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
                <PlusIcon className="size-4" />Thêm khuyến mãi
              </Button>
            </div>
          </div>

          {statusError ? (
            <p role="alert" className="mb-3 rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-danger">{statusError}</p>
          ) : null}

          {isLoading ? (
            <p className="mb-3 text-xs text-admin-muted">Đang tải khuyến mãi…</p>
          ) : error ? (
            <p className="mb-3 text-xs text-admin-danger">Không tải được danh sách khuyến mãi.</p>
          ) : null}

          <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Content className="min-w-0 overflow-x-auto p-0">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                    <th className="px-4 py-3">Mã</th>
                    <th className="px-4 py-3">Tên</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Giá trị</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-admin-muted">Không có khuyến mãi phù hợp.</td></tr>
                  ) : (
                    visible.map((row) => (
                      <tr key={row.id} className="border-b border-admin-border last:border-0">
                        <td className="px-4 py-3 font-mono text-admin-ink">{row.code}</td>
                        <td className="px-4 py-3 text-admin-ink">{row.title}</td>
                        <td className="px-4 py-3 text-admin-muted">{promotionKindLabels[row.type] ?? row.type}</td>
                        <td className="px-4 py-3 font-semibold text-admin-ink">{formatDiscount(row)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                            {promotionStatusLabels[row.status] ?? row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>Sửa</Button>
                            <Button size="sm" variant="outline" className="rounded-lg" isDisabled={statusPending === row.id} onPress={() => void toggleStatus(row)}>
                              {row.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-lg" isDisabled={row.status !== "ACTIVE"} onPress={() => setIssuing(row)}>Phát hành</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card.Content>
            <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
              <span>Hiển thị {visible.length} trong tổng số {filtered.length} khuyến mãi</span>
              <div className="flex gap-1">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
                  <Button key={value} size="sm" variant={currentPage === value ? "outline" : "ghost"} className={currentPage === value ? "min-w-9 rounded-lg border-admin-accent text-admin-accent" : "min-w-9"} onPress={() => setPage(value)}>{value}</Button>
                ))}
              </div>
            </Card.Footer>
          </Card>
        </>
      ) : (
        <div className="space-y-4">
          {persistedCampaigns.length > 0 ? (
            <AdminSelectField
              label="Chiến dịch cần theo dõi"
              value={currentCampaign?.id ?? ""}
              onChange={(id) => setManagedCampaign(persistedCampaigns.find((campaign) => campaign.id === id) ?? null)}
              options={persistedCampaigns.map((campaign) => ({ value: campaign.id, label: campaign.name }))}
            />
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <CampaignPanel onCreated={(campaign) => { setManagedCampaign(campaign); void campaigns.mutate(); }} />
            <CampaignManagePanel campaign={currentCampaign} />
          </div>
        </div>
      )}

      {creating ? <PromotionModal promotion={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <PromotionModal promotion={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
      {issuing ? <IssueModal promotionId={issuing.id} promotionName={issuing.title} onClose={() => setIssuing(null)} onIssued={() => void mutate()} /> : null}
    </AdminPageLayout>
  );
}

function CampaignPanel({ onCreated }: Readonly<{ onCreated: (campaign: ManagedCampaign) => void }>) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("PUSH");
  const [template, setTemplate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const runPreview = async () => {
    setError(null);
    try {
      const result = await adminService.previewAudience({});
      setPreview(result.estimatedRecipients);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không xem trước được audience.");
    }
  };

  const createCampaign = async () => {
    if (name.trim().length < 2 || template.trim().length < 2) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const campaignName = name.trim();
      const campaign = await adminService.createNotificationCampaign({
        title: campaignName,
        channel,
        message: template.trim(),
      });
      onCreated({ id: campaign.campaignId, name: campaignName });
      setMessage(`Đã tạo chiến dịch (${campaignStatusLabel(campaign.status)}).`);
      setName("");
      setTemplate("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không tạo được chiến dịch.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";

  return (
    <Card className="max-w-xl gap-4 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Tạo chiến dịch thông báo</h2>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">Tên chiến dịch</span>
        <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nhắc lịch tháng 9" />
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">Kênh</span>
        <AdminSelectField
          label="Kênh gửi"
          fullWidth
          value={channel}
          onChange={setChannel}
          options={[
            { value: "PUSH", label: "Push" },
            { value: "SMS", label: "SMS" },
            { value: "EMAIL", label: "Email" },
          ]}
        />
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">Nội dung mẫu</span>
        <textarea className="min-h-24 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink" value={template} onChange={(event) => setTemplate(event.target.value)} placeholder="Chào {{name}}, ưu đãi tháng 9..." />
      </label>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="rounded-lg" onPress={() => void runPreview()}>Xem trước audience</Button>
        {preview !== null ? <span className="text-sm text-admin-muted">{preview.toLocaleString("vi-VN")} khách phù hợp</span> : null}
      </div>
      {message ? <p className="text-sm text-admin-accent">{message}</p> : null}
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy || name.trim().length < 2 || template.trim().length < 2} onPress={() => void createCampaign()}>
          {busy ? "Đang tạo…" : "Tạo chiến dịch"}
        </Button>
      </div>
    </Card>
  );
}

function CampaignManagePanel({ campaign }: Readonly<{ campaign: ManagedCampaign | null }>) {
  const metrics = useAdminNotificationCampaignMetrics(campaign?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<number | null>(null);

  const cancel = async () => {
    if (!campaign) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await adminService.cancelNotificationCampaign(campaign.id, undefined, metrics.data?.version);
      setMessage("Đã huỷ chiến dịch.");
      void metrics.mutate();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không huỷ được chiến dịch.");
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
      setError(err instanceof Error && err.message ? err.message : "Không xem trước được audience.");
    }
  };

  const metricLabels: Record<string, string> = {
    status: "Trạng thái",
    estimatedRecipients: "Khách dự kiến",
    targetedCount: "Khách đã chọn",
    processedRecipientCount: "Đã xử lý",
    sentCount: "Đã gửi",
    deliveredCount: "Đã nhận",
    failedCount: "Gửi lỗi",
    inboxOnlyCount: "Chỉ gửi hộp thư",
    suppressedCount: "Đã bỏ qua",
  };
  const metricRows = metrics.data
    ? Object.entries(metrics.data).filter(([key, value]) => key in metricLabels && (typeof value === "number" || typeof value === "string"))
    : [];

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">
        {campaign ? `Chiến dịch — ${campaign.name}` : "Theo dõi chiến dịch vừa tạo"}
      </h2>
      {!campaign ? <p className="text-xs text-admin-muted">Tạo một chiến dịch để xem trạng thái và kết quả gửi tại đây.</p> : null}
      {campaign ? (
        metrics.isLoading ? (
          <p className="text-xs text-admin-muted">Đang tải chỉ số…</p>
        ) : metrics.error ? (
          <p className="text-xs text-admin-danger">Không tải được chỉ số.</p>
        ) : metricRows.length > 0 ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {metricRows.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2 rounded-lg bg-admin-soft/50 px-3 py-1.5">
                <dt className="text-admin-muted">{metricLabels[key]}</dt>
                <dd className="font-semibold text-admin-ink">{key === "status" ? campaignStatusLabel(String(value)) : Number(value).toLocaleString("vi-VN")}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-admin-muted">Không có chỉ số hiển thị.</p>
        )
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="rounded-lg" onPress={() => void previewAudience()}>Xem trước audience</Button>
        {audience !== null ? <span className="text-sm text-admin-muted">{audience.toLocaleString("vi-VN")} khách</span> : null}
        {campaignCanCancel(metrics.data?.status) ? (
          <Button variant="ghost" className="rounded-lg text-admin-danger" isDisabled={!campaign || !metrics.data?.version || busy} onPress={() => void cancel()}>Huỷ chiến dịch</Button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-admin-accent">{message}</p> : null}
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
    </Card>
  );
}

export const meta = { world: "connected", domain: "admin-marketing" } as const;
