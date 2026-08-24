"use client";

import { MagnifyingGlassIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import type { AdminNotificationCampaign, AdminNotificationCampaignDraft } from "@/service";
import { AudienceBuilder } from "./AudienceBuilder";
import { CampaignMetricsPanel } from "./CampaignMetricsPanel";
import { SendConfirmDialog } from "./SendConfirmDialog";
import { campaignStatusLabel } from "./normalize";

const CHANNEL_SUGGESTIONS = ["push", "sms", "email", "zalo"] as const;

type SessionCampaign = {
  readonly id: string;
  readonly name: string;
  readonly status?: string;
};

type PreviewState = { readonly definition: Record<string, unknown>; readonly count: number } | null;

type Selection = { readonly id: string; readonly name: string; readonly status?: string } | null;

/**
 * Notification campaigns are org-level: `POST /api/v1/admin/notification-campaigns`
 * takes no `branchId`, so this screen deliberately does not read
 * `useAdminBranch()`. Scoping to a branch, if desired, belongs inside the
 * audience definition, which the backend owns.
 *
 * The registry has no "list campaigns" endpoint — only metrics by id — so the
 * screen never fabricates a campaign list. It tracks the campaigns created in
 * THIS session and lets the admin look up any campaign by id for metrics/cancel.
 */
export function AdminCampaignsComponent() {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [template, setTemplate] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [definitionText, setDefinitionText] = useState("{}");
  const [preview, setPreview] = useState<PreviewState>(null);

  const [sessionCampaigns, setSessionCampaigns] = useState<ReadonlyArray<SessionCampaign>>([]);
  const [selected, setSelected] = useState<Selection>(null);
  const [lookupInput, setLookupInput] = useState("");
  const [isSendOpen, setIsSendOpen] = useState(false);

  const trimmedName = name.trim();
  const trimmedChannel = channel.trim();
  const trimmedTemplate = template.trim();

  const canSend =
    trimmedName.length >= 2 &&
    trimmedChannel.length > 0 &&
    trimmedTemplate.length > 0 &&
    preview !== null;

  const draft = useMemo<AdminNotificationCampaignDraft | null>(() => {
    if (!canSend || preview === null) return null;
    let scheduledIso: string | undefined;
    if (scheduledAt) {
      const date = new Date(scheduledAt);
      if (!Number.isNaN(date.getTime())) scheduledIso = date.toISOString();
    }
    return {
      name: trimmedName,
      channel: trimmedChannel,
      template: trimmedTemplate,
      audience: preview.definition,
      ...(scheduledIso ? { scheduledAt: scheduledIso } : {}),
    };
  }, [canSend, preview, scheduledAt, trimmedChannel, trimmedName, trimmedTemplate]);

  const onSent = (campaign: AdminNotificationCampaign) => {
    const record: SessionCampaign = {
      id: campaign.id,
      name: campaign.name ?? trimmedName,
      status: campaign.status,
    };
    setSessionCampaigns((prev) => [record, ...prev.filter((item) => item.id !== record.id)]);
    setSelected({ id: record.id, name: record.name, status: record.status });
    setIsSendOpen(false);
    // Force a fresh preview before the next send so the confirmed count can
    // never trail an edited definition.
    setPreview(null);
  };

  const submitLookup = () => {
    const id = lookupInput.trim();
    if (!id) return;
    const known = sessionCampaigns.find((item) => item.id === id);
    setSelected(known ?? { id, name: `Chiến dịch ${id}` });
  };

  return (
    <AdminPageLayout>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-4">
            <h2 className="text-sm font-bold text-admin-ink">Tạo chiến dịch</h2>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-admin-ink">Tên chiến dịch</span>
              <input
                className="min-h-10 rounded-lg border border-admin-border bg-admin-canvas px-3 text-admin-ink outline-none focus:border-admin-accent"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ưu đãi tháng 9"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-admin-ink">Kênh gửi</span>
              <input
                list="campaign-channels"
                className="min-h-10 rounded-lg border border-admin-border bg-admin-canvas px-3 text-admin-ink outline-none focus:border-admin-accent"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                placeholder="push, sms, email…"
              />
              <datalist id="campaign-channels">
                {CHANNEL_SUGGESTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-admin-ink">Nội dung / mã mẫu</span>
              <textarea
                className="min-h-24 rounded-lg border border-admin-border bg-admin-canvas px-3 py-2 text-admin-ink outline-none focus:border-admin-accent"
                value={template}
                onChange={(event) => setTemplate(event.target.value)}
                placeholder="Nội dung thông báo hoặc mã template do backend cung cấp"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-admin-ink">
                Thời điểm gửi <span className="font-normal text-admin-muted">(tùy chọn)</span>
              </span>
              <input
                type="datetime-local"
                className="min-h-10 rounded-lg border border-admin-border bg-admin-canvas px-3 text-admin-ink outline-none focus:border-admin-accent"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
              <span className="text-xs text-admin-muted">
                Bỏ trống để backend gửi ngay theo mặc định.
              </span>
            </label>
          </section>

          <AudienceBuilder
            definitionText={definitionText}
            onDefinitionTextChange={setDefinitionText}
            onPreview={setPreview}
          />

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              className="rounded-lg"
              isDisabled={!canSend}
              onPress={() => setIsSendOpen(true)}
            >
              <PaperAirplaneIcon aria-hidden="true" className="size-4" />
              Gửi chiến dịch
            </Button>
            {!canSend ? (
              <p className="text-xs text-admin-muted">
                Điền tên, kênh, nội dung và xem trước tập khách trước khi gửi.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface p-4">
            <h2 className="text-sm font-bold text-admin-ink">Tra cứu chiến dịch</h2>
            <p className="text-xs text-admin-muted">
              Hệ thống không có API liệt kê chiến dịch. Nhập mã chiến dịch để xem chỉ số hoặc huỷ.
            </p>
            <div className="flex gap-2">
              <input
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-admin-border bg-admin-canvas px-3 font-mono text-sm text-admin-ink outline-none focus:border-admin-accent"
                value={lookupInput}
                onChange={(event) => setLookupInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitLookup();
                }}
                placeholder="Mã chiến dịch…"
                aria-label="Mã chiến dịch"
              />
              <Button
                variant="outline"
                className="rounded-lg border-admin-border"
                isDisabled={!lookupInput.trim()}
                onPress={submitLookup}
              >
                <MagnifyingGlassIcon aria-hidden="true" className="size-4" />
                Xem
              </Button>
            </div>

            {sessionCampaigns.length ? (
              <div className="flex flex-col gap-2 border-t border-admin-border pt-3">
                <p className="text-xs font-semibold text-admin-muted">Đã tạo trong phiên này</p>
                <ul className="flex flex-col gap-1">
                  {sessionCampaigns.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelected({ id: item.id, name: item.name, status: item.status })}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                          selected?.id === item.id
                            ? "border-admin-accent bg-admin-canvas"
                            : "border-admin-border hover:bg-admin-canvas"
                        }`}
                      >
                        <span className="min-w-0 truncate text-admin-ink">{item.name}</span>
                        <span className="shrink-0 text-xs text-admin-muted">
                          {campaignStatusLabel(item.status)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {selected ? (
            <CampaignMetricsPanel
              key={selected.id}
              campaignId={selected.id}
              campaignName={selected.name}
              status={selected.status}
              onCancelled={() => {
                setSessionCampaigns((prev) =>
                  prev.map((item) =>
                    item.id === selected.id ? { ...item, status: "cancelled" } : item,
                  ),
                );
                setSelected((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
              }}
            />
          ) : (
            <section className="rounded-xl border border-dashed border-admin-border p-6 text-center text-sm text-admin-muted">
              Chọn một chiến dịch hoặc nhập mã để xem chỉ số.
            </section>
          )}
        </div>
      </div>

      {isSendOpen && draft ? (
        <SendConfirmDialog draft={draft} onClose={() => setIsSendOpen(false)} onSent={onSent} />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-campaigns" } as const;
