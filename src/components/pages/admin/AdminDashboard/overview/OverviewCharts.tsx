"use client";

import { Card } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_AXIS,
  CHART_CATEGORICAL,
  CHART_GRID,
  CHART_OTHER,
  CHART_SERIES,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from "@/components/blocks/admin/charts";
import { formatMoney } from "@/lib/admin-format";
import type { AdminBranchOverview } from "@/service";
import { compactYen, formatBucketLabel, sharePercent } from "./overview-period";

const AXIS_TICK = { fontSize: 11, fill: CHART_AXIS };
const TOOLTIP = { contentStyle: CHART_TOOLTIP_STYLE, itemStyle: CHART_TOOLTIP_ITEM_STYLE, labelStyle: CHART_TOOLTIP_LABEL_STYLE };

/** A titled card; `wide` spans two thirds of the twelve-column grid, otherwise one third. */
export function ChartCard({ title, hint, wide = false, children }: Readonly<{ title: string; hint?: string; wide?: boolean; children: ReactNode }>) {
  return (
    <Card className={`gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none ${wide ? "xl:col-span-8" : "xl:col-span-4"}`}>
      <Card.Header className="flex flex-col items-start gap-0.5 px-4 pt-4 sm:px-5 sm:pt-5">
        <h3 className="text-sm font-bold text-admin-ink">{title}</h3>
        {hint ? <p className="text-xs text-admin-muted">{hint}</p> : null}
      </Card.Header>
      <Card.Content className="px-2 pb-4 pt-3 sm:px-3 sm:pb-5">{children}</Card.Content>
    </Card>
  );
}

function Empty({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="py-10 text-center text-xs text-admin-muted">{children}</p>;
}

/**
 * Revenue over the window (accent area) against the same position in the previous window (a thin
 * muted line). One measure on one axis; the legend names both.
 */
export function RevenueCompareChart({ overview }: Readonly<{ overview: AdminBranchOverview }>) {
  const t = useTranslations("admin.dashboard.overview");
  const locale = useLocale();
  const data = overview.series.map((point) => ({ ...point, label: formatBucketLabel(point.bucket, overview.range.granularity, locale) }));
  const accent = CHART_SERIES[0];
  if (data.every((point) => point.revenue === 0 && point.previousRevenue === 0)) return <Empty>{t("noRevenue")}</Empty>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="overview-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_GRID }} minTickGap={12} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} tickFormatter={compactYen} />
        <Tooltip {...TOOLTIP} formatter={(value, name) => [formatMoney(Number(value ?? 0)), name]} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--admin-muted)" }} iconType="plainline" />
        <Line type="monotone" dataKey="previousRevenue" name={t("series.previous")} stroke={CHART_AXIS} strokeWidth={1.5} strokeOpacity={0.7} dot={false} />
        <Area type="monotone" dataKey="revenue" name={t("series.current")} stroke={accent} strokeWidth={2} fill="url(#overview-revenue-fill)" activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/**
 * Appointment outcomes per day / month, stacked. These colours carry meaning (done / cancelled /
 * no-show), so they are the status tokens, always with a legend.
 */
export function OutcomesChart({ overview }: Readonly<{ overview: AdminBranchOverview }>) {
  const t = useTranslations("admin.dashboard.overview");
  const locale = useLocale();
  const data = overview.series.map((point) => ({ ...point, label: formatBucketLabel(point.bucket, overview.range.granularity, locale) }));
  if (data.every((point) => point.completed + point.cancelled + point.noShow === 0)) return <Empty>{t("noAppointments")}</Empty>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="20%">
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_GRID }} minTickGap={12} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip {...TOOLTIP} cursor={{ fill: "var(--admin-soft)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--admin-muted)" }} iconType="circle" />
        <Bar dataKey="completed" name={t("outcomes.completed")} stackId="outcome" fill="var(--admin-success)" />
        <Bar dataKey="cancelled" name={t("outcomes.cancelled")} stackId="outcome" fill="var(--admin-warning)" />
        <Bar dataKey="noShow" name={t("outcomes.noShow")} stackId="outcome" fill="var(--admin-danger)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Colour follows the payment method, never its rank, so a method keeps its colour across periods.
// Only three methods get their own colour (all that stay tellable apart); the rest fold into "other".
const METHOD_SLOT: Record<string, number> = { CASH: 0, PAYPAY: 1, VISA: 2 };
const OTHER = "OTHER";

/** Folds every method without its own slot into one "other" entry, kept last. */
export function foldPaymentMethods(methods: AdminBranchOverview["paymentMethods"]): AdminBranchOverview["paymentMethods"] {
  const own = methods.filter((entry) => entry.method in METHOD_SLOT);
  const rest = methods.filter((entry) => !(entry.method in METHOD_SLOT));
  if (rest.length === 0) return own;
  return [...own, { method: OTHER, amount: rest.reduce((sum, entry) => sum + entry.amount, 0), count: rest.reduce((sum, entry) => sum + entry.count, 0) }];
}

/** Part-to-whole of collected money by method: a donut with a labelled legend (amount + share). */
export function PaymentMethodsChart({ overview }: Readonly<{ overview: AdminBranchOverview }>) {
  const t = useTranslations("admin.dashboard.overview");
  const tMethod = useTranslations("admin.paymentMethod");
  const methods = foldPaymentMethods(overview.paymentMethods);
  const total = methods.reduce((sum, entry) => sum + entry.amount, 0);
  if (total === 0) return <Empty>{t("noPayments")}</Empty>;
  // Same labels as the rest of the console ("admin.paymentMethod" is keyed in lower case).
  const label = (method: string) => (tMethod.has(method.toLowerCase()) ? tMethod(method.toLowerCase()) : method);
  const color = (method: string) => (method in METHOD_SLOT ? CHART_CATEGORICAL[METHOD_SLOT[method]] : CHART_OTHER);
  return (
    <div className="flex flex-col items-center gap-3 px-2">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Tooltip {...TOOLTIP} formatter={(value, name) => [formatMoney(Number(value ?? 0)), name]} />
          <Pie data={methods.map((entry) => ({ name: label(entry.method), value: entry.amount, method: entry.method }))} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="var(--admin-surface)" strokeWidth={2}>
            {methods.map((entry) => <Cell key={entry.method} fill={color(entry.method)} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <ul className="grid w-full gap-1.5 text-xs">
        {methods.map((entry) => (
          <li key={entry.method} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color(entry.method) }} />
            <span className="min-w-0 flex-1 truncate text-admin-ink">{label(entry.method)}</span>
            <span className="tabular-nums text-admin-muted">{sharePercent(entry.amount, total)}%</span>
            <span className="w-20 text-right font-semibold tabular-nums text-admin-ink">{formatMoney(entry.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A ranked list with one bar per row, longest first: one series, so one colour. HTML rather than
 * SVG so long Vietnamese / Japanese names wrap instead of being clipped.
 */
export function RankedBars({ rows, empty, limit = 5 }: Readonly<{ rows: ReadonlyArray<{ id: string; name: string; value: number; detail?: string }>; empty: string; limit?: number }>) {
  const shown = rows.slice(0, limit);
  const max = Math.max(0, ...shown.map((row) => row.value));
  if (shown.length === 0 || max === 0) return <Empty>{empty}</Empty>;
  return (
    <ol className="grid gap-3 px-2">
      {shown.map((row, index) => (
        <li key={row.id} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-admin-ink">
              <span className="mr-1.5 tabular-nums text-admin-muted">{index + 1}.</span>
              {row.name}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-admin-ink">{formatMoney(row.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-admin-soft" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (row.value / max) * 100)}%`, background: CHART_SERIES[0] }} />
          </div>
          {row.detail ? <span className="text-[11px] text-admin-muted">{row.detail}</span> : null}
        </li>
      ))}
    </ol>
  );
}

/** New vs returning customers: two numbers and one split bar, not a two-slice pie. */
export function CustomerMix({ overview }: Readonly<{ overview: AdminBranchOverview }>) {
  const t = useTranslations("admin.dashboard.overview");
  const { newCustomers, returningCustomers, uniqueCustomers } = overview.kpi;
  if (uniqueCustomers === 0) return <Empty>{t("noCustomers")}</Empty>;
  const newShare = sharePercent(newCustomers, uniqueCustomers);
  return (
    <div className="grid gap-4 px-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-admin-muted">{t("customers.new")}</p>
          <p className="text-2xl font-bold tabular-nums text-admin-ink">{newCustomers}</p>
        </div>
        <div>
          <p className="text-xs text-admin-muted">{t("customers.returning")}</p>
          <p className="text-2xl font-bold tabular-nums text-admin-ink">{returningCustomers}</p>
        </div>
      </div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={t("customers.split", { newShare, returningShare: 100 - newShare })}>
        <div style={{ width: `${newShare}%`, background: CHART_CATEGORICAL[0] }} />
        <div style={{ width: `${100 - newShare}%`, background: CHART_CATEGORICAL[1] }} />
      </div>
      <div className="flex justify-between text-[11px] text-admin-muted">
        <span>{t("customers.newShare", { share: newShare })}</span>
        <span>{t("customers.total", { count: uniqueCustomers })}</span>
      </div>
    </div>
  );
}
