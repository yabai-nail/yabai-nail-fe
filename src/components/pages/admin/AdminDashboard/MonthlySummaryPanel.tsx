"use client";

import { Card } from "@heroui/react";
import { useMemo } from "react";

import { useAdminBranch, useAdminStaffPerformance, useRevenueReportRange } from "@/service";
import {
  MISSING,
  buildMonthlyNet,
  buildMonthlyRows,
  currentMonthPeriod,
  monthRange,
} from "./adapters";

export function MonthlySummaryPanel() {
  const { branchId } = useAdminBranch();
  const period = useMemo(() => currentMonthPeriod(new Date()), []);
  const range = useMemo(() => monthRange(period), [period]);

  const report = useRevenueReportRange(range.from, range.to);
  // Monthly commission only exists on the branch staff-performance read model;
  // the revenue report does not expose it.
  const performance = useAdminStaffPerformance(branchId, { period });

  const commissionVnd = useMemo(() => {
    const value = performance.data?.kpi?.commissionAmountVnd;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }, [performance.data]);

  const rows = useMemo(() => buildMonthlyRows(report.data, commissionVnd), [report.data, commissionVnd]);
  const net = useMemo(() => buildMonthlyNet(report.data, commissionVnd), [report.data, commissionVnd]);

  const hasError = report.error !== undefined && performance.error !== undefined;
  const isLoading = report.isLoading || (branchId !== null && performance.isLoading);
  const [year, month] = period.split("-");

  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-4">
      <Card.Header className="px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">
          Thu nhập của quán <span className="font-normal text-admin-muted">(tháng {month}/{year})</span>
        </h2>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        {hasError ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-3 text-center text-xs text-danger">
            Không tải được tổng kết tháng.
          </p>
        ) : isLoading ? (
          <p className="py-3 text-center text-xs text-admin-muted">Đang tải tổng kết tháng…</p>
        ) : (
          <dl className="space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="flex justify-between gap-4 text-xs">
                <dt className="text-admin-muted">{row.label}</dt>
                <dd className="font-semibold text-admin-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-5 border-t border-admin-border pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm font-bold text-admin-ink">Còn lại sau hoa hồng</p>
            <p className="text-xl font-extrabold text-admin-accent">
              {hasError ? MISSING : isLoading ? "…" : net}
            </p>
          </div>
          <p className="mt-2 text-right text-xs text-admin-muted">
            Chưa trừ chi phí vận hành — backend chưa có chi phí theo tháng
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}
