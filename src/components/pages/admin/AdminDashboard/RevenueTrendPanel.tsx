"use client";

import { Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_AXIS,
  CHART_GRID,
  CHART_SERIES,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from "@/components/blocks/admin/charts";
import { formatMoney } from "@/lib/admin-format";
import { useRevenueReportRange } from "@/service";
import { buildRevenueTrend, currentMonthPeriod, monthRange } from "./adapters";

/** Yen axis ticks: full amounts are too wide, so 46 800 -> "47K", 1 200 000 -> "1.2M". */
function compactYen(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

export function RevenueTrendPanel() {
  const t = useTranslations("admin.dashboard");
  const period = useMemo(() => currentMonthPeriod(new Date()), []);
  const range = useMemo(() => monthRange(period), [period]);
  // Same SWR key as MonthlySummaryPanel's month report, so this shares its cache
  // entry rather than issuing a second request for the same window.
  const report = useRevenueReportRange(range.from, range.to);
  const points = useMemo(() => buildRevenueTrend(report.data?.rows), [report.data]);

  const accent = CHART_SERIES[0];

  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">{t("trend.title")}</h2>
      </Card.Header>
      <Card.Content className="px-2 pb-4 pt-3 sm:px-3 sm:pb-5">
        {report.error ? (
          <p role="alert" className="mx-2 rounded-lg bg-danger/10 px-3 py-3 text-center text-xs text-danger">
            {t("trend.error")}
          </p>
        ) : report.isLoading ? (
          <p className="py-12 text-center text-xs text-admin-muted">{t("trend.loading")}</p>
        ) : points.length === 0 ? (
          <p className="py-12 text-center text-xs text-admin-muted">{t("trend.empty")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={[...points]} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="admin-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke={CHART_AXIS}
                tick={{ fontSize: 11, fill: CHART_AXIS }}
                tickLine={false}
                axisLine={{ stroke: CHART_GRID }}
                minTickGap={16}
              />
              <YAxis
                stroke={CHART_AXIS}
                tick={{ fontSize: 11, fill: CHART_AXIS }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={compactYen}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                formatter={(value) => [formatMoney(Number(value ?? 0)), t("trend.seriesLabel")]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={accent}
                strokeWidth={2}
                fill="url(#admin-revenue-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card.Content>
    </Card>
  );
}
