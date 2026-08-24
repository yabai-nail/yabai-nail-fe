"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { adminService, useAdminPromotions } from "@/service";
import { IssueModal } from "./IssueModal";
import { PromotionModal } from "./PromotionModal";
import {
  adaptPromotion,
  filterPromotions,
  formatDiscount,
  paginate,
  promotionFixtures,
  promotionKindLabels,
  promotionStatusLabels,
  promotionStatuses,
  type PromotionRow,
} from "./data";

const pageSize = 8;
type Tab = "promotions" | "campaigns";

export function AdminMarketingComponent() {
  const [tab, setTab] = useState<Tab>("promotions");
  const { data, isLoading, error, mutate } = useAdminPromotions();

  const source = useMemo<ReadonlyArray<PromotionRow>>(() => {
    if (!data?.items) return promotionFixtures;
    if (data.items.length === 0) return [];
    return data.items.map(adaptPromotion);
  }, [data]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PromotionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [issuing, setIssuing] = useState<PromotionRow | null>(null);

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
            <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
              Trạng thái
              <select
                value={status}
                onChange={(event) => { setStatus(event.target.value); setPage(1); }}
                className="min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink"
              >
                <option value="all">Tất cả</option>
                {statuses.map((code) => (
                  <option key={code} value={code}>{promotionStatusLabels[code] ?? code}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminSearchField label="Tìm khuyến mãi" placeholder="Mã hoặc tên..." value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
              <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
                <PlusIcon className="size-4" />Thêm khuyến mãi
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="mb-3 text-xs text-admin-muted">Đang tải khuyến mãi…</p>
          ) : error ? (
            <p className="mb-3 text-xs text-admin-danger">Không tải được — hiển thị dữ liệu mẫu.</p>
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
                        <td className="px-4 py-3 text-admin-ink">{row.name}</td>
                        <td className="px-4 py-3 text-admin-muted">{promotionKindLabels[row.kind] ?? row.kind}</td>
                        <td className="px-4 py-3 font-semibold text-admin-ink">{formatDiscount(row)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                            {promotionStatusLabels[row.status] ?? row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>Sửa</Button>
                            <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => setIssuing(row)}>Phát hành</Button>
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
        <CampaignPanel />
      )}

      {creating ? <PromotionModal promotion={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <PromotionModal promotion={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
      {issuing ? <IssueModal promotionId={issuing.id} promotionName={issuing.name} onClose={() => setIssuing(null)} onIssued={() => void mutate()} /> : null}
    </AdminPageLayout>
  );
}

function CampaignPanel() {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("PUSH");
  const [template, setTemplate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const audience = { segment: "ALL" as const };

  const runPreview = async () => {
    setError(null);
    try {
      const result = await adminService.previewAudience({ definition: audience });
      setPreview(result.matchedCount);
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
      const campaign = await adminService.createNotificationCampaign({
        name: name.trim(),
        channel,
        template: template.trim(),
        audience,
      });
      setMessage(`Đã tạo chiến dịch (${campaign.status ?? "PENDING"}).`);
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
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">Kênh</span>
        <select className={inputClass} value={channel} onChange={(event) => setChannel(event.target.value)}>
          <option value="PUSH">Push</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
        </select>
      </label>
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

export const meta = { world: "connected", domain: "admin-marketing" } as const;
