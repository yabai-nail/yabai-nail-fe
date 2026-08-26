"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Card, Dropdown } from "@heroui/react";
import { useMemo, useState } from "react";

import { useAdminBranch, useAdminDashboard, useRevenueReportRange } from "@/service";
import {
  MISSING,
  buildPaymentMethodRows,
  buildRangeRevenueRows,
  buildTodayRevenueRows,
  formatOptionalMoney,
  revenueRange,
  revenueRangeLabels,
  type RevenueRangePreset,
} from "./adapters";

const presets: ReadonlyArray<RevenueRangePreset> = ["today", "week", "month"];

export function RevenuePanel() {
  const { branchId } = useAdminBranch();
  const [preset, setPreset] = useState<RevenueRangePreset>("today");

  const dashboard = useAdminDashboard(branchId);
  const range = useMemo(() => revenueRange(preset, new Date()), [preset]);
  // Only the branch dashboard carries chi phí / hoa hồng / phần tiệm nhận, and
  // only for today. Wider ranges fall back to the revenue report, which exposes
  // a different (and smaller) metric set.
  const report = useRevenueReportRange(
    preset === "today" ? null : range.from,
    preset === "today" ? null : range.to,
  );

  const isToday = preset === "today";
  const source = isToday ? dashboard : report;
  const hasError = source.error !== undefined;
  const isLoading = isToday ? !branchId || dashboard.isLoading : report.isLoading;

  const rows = useMemo(
    () => (isToday ? buildTodayRevenueRows(dashboard.data?.kpi) : buildRangeRevenueRows(report.data)),
    [isToday, dashboard.data, report.data],
  );

  const netLabel = isToday ? "Tiền quán thực nhận" : "Doanh thu thuần";
  const netValue = isToday
    ? formatOptionalMoney(dashboard.data?.kpi.salonShare)
    : formatOptionalMoney(
        typeof report.data?.metrics?.netRevenue?.value === "number"
          ? report.data.metrics.netRevenue.value
          : null,
      );

  const paymentRows = useMemo(
    () => buildPaymentMethodRows(dashboard.data?.paymentMethods),
    [dashboard.data],
  );

  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-4">
      <Card.Header className="flex w-full flex-row items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">Doanh thu nhanh</h2>
        <Dropdown>
          <Dropdown.Trigger className="flex min-h-9 items-center gap-2 rounded-lg border border-admin-border px-3 text-xs font-medium text-admin-ink outline-none focus-visible:ring-2 focus-visible:ring-admin-accent">
            {revenueRangeLabels[preset]}
            <ChevronDownIcon aria-hidden="true" className="size-4 text-admin-muted" />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="admin-shell">
            <Dropdown.Menu
              aria-label="Khoảng thời gian doanh thu"
              selectionMode="single"
              selectedKeys={new Set([preset])}
              onSelectionChange={(keys) => {
                const next = typeof keys === "string" ? keys : Array.from(keys)[0];
                if (typeof next === "string" && presets.includes(next as RevenueRangePreset)) {
                  setPreset(next as RevenueRangePreset);
                }
              }}
            >
              {presets.map((id) => (
                <Dropdown.Item key={id} id={id} textValue={revenueRangeLabels[id]}>
                  {revenueRangeLabels[id]}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </Card.Header>

      <Card.Content className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        {hasError ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-3 text-center text-xs text-danger">
            Không tải được số liệu doanh thu.
          </p>
        ) : isLoading ? (
          <p className="py-3 text-center text-xs text-admin-muted">Đang tải số liệu doanh thu…</p>
        ) : (
          <dl className="space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="flex items-start justify-between gap-4 text-sm">
                <dt className="text-admin-muted">{row.label}</dt>
                <dd className="shrink-0 font-semibold text-admin-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="my-5 border-t border-admin-border pt-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-admin-ink">{netLabel}</p>
            <p className="text-lg font-bold text-admin-accent">
              {hasError ? MISSING : isLoading ? "…" : netValue}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-admin-soft/70 p-4">
          <h3 className="text-xs font-bold text-admin-ink">Doanh thu theo phương thức</h3>
          {!isToday ? (
            <p className="mt-3 text-xs text-admin-muted">
              Chỉ có số liệu theo phương thức cho hôm nay.
            </p>
          ) : dashboard.error ? (
            <p className="mt-3 text-xs text-danger">Không tải được phương thức thanh toán.</p>
          ) : !branchId || dashboard.isLoading ? (
            <p className="mt-3 text-xs text-admin-muted">Đang tải…</p>
          ) : paymentRows.length === 0 ? (
            <p className="mt-3 text-xs text-admin-muted">Hôm nay chưa có giao dịch nào.</p>
          ) : (
            <dl className="mt-3 space-y-3">
              {paymentRows.map((method) => (
                <div key={method.id} className="flex justify-between gap-4 text-xs">
                  <dt className="text-admin-muted">{method.label}</dt>
                  <dd className="font-semibold text-admin-ink">{method.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
