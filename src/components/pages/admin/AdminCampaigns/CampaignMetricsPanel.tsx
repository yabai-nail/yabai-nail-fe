"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useState } from "react";

import { useAdminNotificationCampaignMetrics } from "@/service";
import { CancelCampaignDialog } from "./CancelCampaignDialog";
import { campaignStatusLabel, isCancellableStatus, metricRows } from "./normalize";

/**
 * The registry exposes metrics only per campaign id — there is no list
 * endpoint — so this panel renders one campaign at a time, driven by an id the
 * caller already holds (a campaign created this session, or one looked up by
 * id).
 */
export function CampaignMetricsPanel({
  campaignId,
  campaignName,
  status,
  onCancelled,
}: Readonly<{
  campaignId: string;
  campaignName: string;
  status?: string;
  onCancelled: () => void;
}>) {
  const { data, error, isLoading, mutate } = useAdminNotificationCampaignMetrics(campaignId);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const rows = metricRows(data);
  const canCancel = isCancellableStatus(status);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-admin-ink">{campaignName}</h2>
          <p className="mt-0.5 text-xs text-admin-muted">
            Mã: <span className="font-mono">{campaignId}</span>
            {status ? (
              <span className="ml-2 rounded-full bg-admin-canvas px-2 py-0.5 text-admin-ink">
                {campaignStatusLabel(status)}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
            isDisabled={isLoading}
            onPress={() => void mutate()}
          >
            <ArrowPathIcon aria-hidden="true" className="size-4" />
            Làm mới
          </Button>
          {canCancel ? (
            <Button
              variant="danger"
              size="sm"
              className="rounded-lg"
              onPress={() => setIsCancelOpen(true)}
            >
              Huỷ chiến dịch
            </Button>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-admin-muted">Đang tải chỉ số…</p>
      ) : error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          Không tải được chỉ số: {error.message}
        </p>
      ) : rows.length ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-admin-border bg-admin-canvas px-3 py-3"
            >
              <dt className="text-xs text-admin-muted">{row.label}</dt>
              <dd className="mt-1 text-xl font-bold text-admin-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-admin-muted">
          Chưa có chỉ số cho chiến dịch này — thường xuất hiện sau khi bắt đầu gửi.
        </p>
      )}

      {isCancelOpen ? (
        <CancelCampaignDialog
          campaignId={campaignId}
          campaignName={campaignName}
          onClose={() => setIsCancelOpen(false)}
          onCancelled={() => {
            setIsCancelOpen(false);
            void mutate();
            onCancelled();
          }}
        />
      ) : null}
    </section>
  );
}
