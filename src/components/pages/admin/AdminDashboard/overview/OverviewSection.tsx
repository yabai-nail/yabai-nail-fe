"use client";

import {
  ArrowDownTrayIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ComponentType } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { formatMoney } from "@/lib/admin-format";
import {
  adminService,
  useAdminBranch,
  useAdminBranchOverview,
  useAdminPermission,
  useAdminReportExport,
  type AdminBranchOverview,
  type AdminOverviewPeriod,
  type AdminReportExport,
} from "@/service";
import { ChartCard, CustomerMix, OutcomesChart, PaymentMethodsChart, RankedBars, RevenueCompareChart } from "./OverviewCharts";
import { formatPeriodLabel, isCurrentOrFutureWindow, shiftOverviewAnchor } from "./overview-period";

const PERIODS: ReadonlyArray<AdminOverviewPeriod> = ["WEEK", "MONTH", "YEAR"];

/**
 * The owner's at-a-glance view: pick a week, month or year, step back and forth, and read what
 * is waiting, how the money moved against the window before, and where it came from.
 */
export function OverviewSection() {
  const t = useTranslations("admin.dashboard.overview");
  const locale = useLocale();
  const { branchId } = useAdminBranch();
  const [period, setPeriod] = useState<AdminOverviewPeriod>("MONTH");
  // Undefined anchors the window on "today" in the branch's own zone, resolved by the API.
  const [anchor, setAnchor] = useState<string | undefined>(undefined);
  const { data, error, isLoading } = useAdminBranchOverview(branchId, period, anchor);
  const today = new Date().toLocaleDateString("en-CA");
  const range = data?.range;

  const choosePeriod = (next: AdminOverviewPeriod) => {
    setPeriod(next);
    setAnchor(undefined);
  };
  const step = (direction: -1 | 1) => {
    if (range) setAnchor(shiftOverviewAnchor(range.from, period, direction));
  };

  return (
    <section aria-labelledby="overview-heading" className="mt-6 grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="overview-heading" className="text-base font-bold text-admin-ink">{t("title")}</h2>
        <div role="group" aria-label={t("periodLabel")} className="flex rounded-lg border border-admin-border bg-admin-surface p-0.5">
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => choosePeriod(value)}
              className={`min-h-8 rounded-md px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${
                period === value ? "bg-admin-accent text-admin-on-accent" : "text-admin-muted hover:text-admin-ink"
              }`}
            >
              {t(`periods.${value}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button isIconOnly size="sm" variant="ghost" aria-label={t("previous")} isDisabled={!range} onPress={() => step(-1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold text-admin-ink" aria-live="polite">
            {range ? formatPeriodLabel(range, locale) : "…"}
          </span>
          <Button isIconOnly size="sm" variant="ghost" aria-label={t("next")} isDisabled={!range || isCurrentOrFutureWindow(range.toExclusive, today)} onPress={() => step(1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <div className="ml-auto">
          {data && branchId ? <OverviewExport key={`${branchId}:${period}:${data.range.from}`} branchId={branchId} period={period} date={data.range.from} /> : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-admin-soft px-3 py-3 text-center text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : isLoading || !data ? (
        <p className="py-12 text-center text-xs text-admin-muted">{t("loading")}</p>
      ) : (
        <OverviewBody overview={data} />
      )}
    </section>
  );
}

function OverviewBody({ overview }: Readonly<{ overview: AdminBranchOverview }>) {
  const t = useTranslations("admin.dashboard.overview");
  const { kpi } = overview;
  const previous = t(`previousOf.${overview.range.period}`);
  return (
    <>
      <ActionItems items={overview.actionItems} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label={t("kpi.revenue")} value={formatMoney(kpi.revenue)} change={kpi.revenueChangePercent} changeHint={previous} />
        <Kpi label={t("kpi.netRevenue")} value={formatMoney(kpi.netRevenue)} hint={t("kpi.refund", { amount: formatMoney(kpi.refundTotal) })} />
        <Kpi label={t("kpi.completed")} value={String(kpi.completedCount)} hint={t("kpi.previousCount", { count: kpi.previousCompletedCount, period: previous })} />
        <Kpi label={t("kpi.averageTicket")} value={kpi.averageTicket === null ? "—" : formatMoney(kpi.averageTicket)} />
        <Kpi
          label={t("kpi.cancellationRate")}
          value={kpi.cancellationRatePercent === null ? "—" : `${kpi.cancellationRatePercent}%`}
          hint={t("kpi.cancelBreakdown", { cancelled: kpi.cancelledCount, noShow: kpi.noShowCount })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <ChartCard wide title={t("charts.revenue")} hint={t("charts.revenueHint", { period: previous })}>
          <RevenueCompareChart overview={overview} />
        </ChartCard>
        <ChartCard title={t("charts.payments")}>
          <PaymentMethodsChart overview={overview} />
        </ChartCard>
        <ChartCard wide title={t("charts.outcomes")}>
          <OutcomesChart overview={overview} />
        </ChartCard>
        <ChartCard title={t("charts.customers")}>
          <CustomerMix overview={overview} />
        </ChartCard>
        <ChartCard title={t("charts.services")}>
          <RankedBars
            empty={t("noServices")}
            rows={overview.services.map((entry) => ({ id: entry.serviceId, name: entry.name, value: entry.revenue, detail: t("timesSold", { count: entry.count }) }))}
          />
        </ChartCard>
        <ChartCard title={t("charts.staff")}>
          <RankedBars
            empty={t("noStaff")}
            rows={overview.staff.map((entry) => ({ id: entry.staffId, name: entry.displayName || "—", value: entry.revenue, detail: t("completedCount", { count: entry.completedCount }) }))}
          />
        </ChartCard>
        {overview.branchComparison && overview.branchComparison.length > 1 ? (
          <ChartCard title={t("charts.branches")}>
            <RankedBars
              limit={20}
              empty={t("noRevenue")}
              rows={[...overview.branchComparison].sort((left, right) => right.revenue - left.revenue).map((entry) => ({ id: entry.branchId, name: entry.branchName, value: entry.revenue, detail: t("completedCount", { count: entry.completedCount }) }))}
            />
          </ChartCard>
        ) : null}
      </div>
      <p className="text-[11px] text-admin-muted">{t("basisNote")}</p>
    </>
  );
}

function Kpi({ label, value, hint, change, changeHint }: Readonly<{ label: string; value: string; hint?: string; change?: number | null; changeHint?: string }>) {
  const t = useTranslations("admin.dashboard.overview");
  const up = typeof change === "number" && change >= 0;
  return (
    <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
      <p className="text-xs text-admin-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-admin-ink">{value}</p>
      {typeof change === "number" ? (
        <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${up ? "text-admin-success" : "text-admin-danger"}`}>
          {up ? <ArrowTrendingUpIcon aria-hidden className="size-3.5" /> : <ArrowTrendingDownIcon aria-hidden className="size-3.5" />}
          {t("change", { percent: `${up ? "+" : ""}${change}`, period: changeHint ?? "" })}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-admin-muted">{hint}</p>
      ) : change === null && changeHint ? (
        <p className="mt-1 text-xs text-admin-muted">{t("noComparison")}</p>
      ) : null}
    </div>
  );
}

const ACTIONS: ReadonlyArray<{ key: keyof AdminBranchOverview["actionItems"]; href: string; icon: ComponentType<{ className?: string }> }> = [
  { key: "pendingConfirmations", href: "/admin/appointments", icon: ClockIcon },
  { key: "unreadConversations", href: "/admin/messages", icon: ChatBubbleLeftRightIcon },
  { key: "pendingSalesReports", href: "/admin/sales-reports", icon: DocumentTextIcon },
  { key: "pendingLeaveRequests", href: "/admin/operations", icon: ClipboardDocumentCheckIcon },
];

/** "Needs you now": each count links to the screen that clears it; zero reads as done. */
function ActionItems({ items }: Readonly<{ items: AdminBranchOverview["actionItems"] }>) {
  const t = useTranslations("admin.dashboard.overview");
  return (
    <nav aria-label={t("actions.title")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ACTIONS.map(({ key, href, icon: Icon }) => {
        const count = items[key];
        return (
          <Link
            key={key}
            href={href}
            className={`flex items-center gap-3 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${
              count > 0 ? "border-admin-accent/40 bg-admin-soft hover:border-admin-accent" : "border-admin-border bg-admin-surface hover:bg-admin-soft"
            }`}
          >
            <Icon className={`size-5 shrink-0 ${count > 0 ? "text-admin-accent" : "text-admin-muted"}`} />
            <span className="min-w-0 flex-1 text-xs text-admin-ink">{t(`actions.${key}`)}</span>
            <span className={`text-lg font-bold tabular-nums ${count > 0 ? "text-admin-accent" : "text-admin-muted"}`}>{count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Queues the dashboard as an Excel file through the shared export queue, then offers the download. */
function OverviewExport({ branchId, period, date }: Readonly<{ branchId: string; period: AdminOverviewPeriod; date: string }>) {
  const t = useTranslations("admin.dashboard.overview");
  const locale = useLocale();
  const canExport = useAdminPermission("report.export.all");
  const [info, setInfo] = useState<AdminReportExport | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const status = useAdminReportExport(info?.exportId ?? null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  // The worker builds the file in the background: ask again every 2 s until it is READY or FAILED.
  const state = status.data?.status;
  const { mutate: refreshStatus } = status;
  useEffect(() => {
    if (!info || state === "READY" || state === "FAILED") return;
    const timer = window.setInterval(() => void refreshStatus(), 2_000);
    return () => window.clearInterval(timer);
  }, [info, state, refreshStatus]);
  if (!canExport) return null;

  const queue = async () => {
    setBusy(true);
    setFailed(null);
    try {
      const created = await adminService.createReportExport({ reportType: "BRANCH_OVERVIEW", format: "XLSX", locale: locale === "ja" ? "ja" : "vi", filters: { branchId, period, date } });
      if (!mounted.current) return;
      notifySuccess(t("export.queued"));
      setInfo(created);
    } catch (thrown) {
      if (mounted.current) setFailed(thrown instanceof Error && thrown.message ? thrown.message : t("export.failed"));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const download = async () => {
    if (!info) return;
    try {
      const result = await adminService.reportExportDownloadUrl(info.exportId);
      window.location.assign(result.signedUrl);
    } catch (thrown) {
      if (mounted.current) setFailed(thrown instanceof Error && thrown.message ? thrown.message : t("export.failed"));
    }
  };

  return (
    <div className="flex items-center gap-2">
      {failed || state === "FAILED" ? <span role="alert" className="text-xs text-admin-danger">{failed ?? t("export.failed")}</span> : null}
      {state === "READY" ? (
        <Button size="sm" variant="primary" className="rounded-lg" onPress={() => void download()}>
          <ArrowDownTrayIcon className="size-4" />{t("export.download")}
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="rounded-lg" isDisabled={busy || (info !== null && state !== "FAILED")} onPress={() => void queue()}>
          <ArrowDownTrayIcon className="size-4" />{info && state !== "FAILED" ? t("export.preparing") : t("export.action")}
        </Button>
      )}
    </div>
  );
}
