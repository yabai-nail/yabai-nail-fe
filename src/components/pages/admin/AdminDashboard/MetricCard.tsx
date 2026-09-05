import {
  BanknotesIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Card } from "@heroui/react";
import type { DashboardMetric, MetricIcon, MetricTone } from "./data";

const metricIcons: Record<MetricIcon, typeof CalendarDaysIcon> = {
  calendar: CalendarDaysIcon,
  revenue: BanknotesIcon,
  customers: UsersIcon,
  staff: UserGroupIcon,
};

const toneClasses: Record<MetricTone, { icon: string; value: string }> = {
  accent: { icon: "bg-admin-soft text-admin-accent", value: "text-admin-accent" },
  success: { icon: "bg-admin-success/10 text-admin-success", value: "text-admin-success" },
  info: { icon: "bg-admin-info/10 text-admin-info", value: "text-admin-info" },
  violet: { icon: "bg-admin-violet/10 text-admin-violet", value: "text-admin-violet" },
};

export function MetricCard({ metric }: Readonly<{ metric: DashboardMetric }>) {
  const Icon = metricIcons[metric.icon];
  const tone = toneClasses[metric.tone];

  return (
    <Card className="flex h-full flex-col gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Content className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone.icon}`}>
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-admin-ink">{metric.label}</p>
            <p className={`mt-1 flex flex-wrap items-baseline gap-2 text-2xl font-bold ${tone.value}`}>
              {metric.value}
              {metric.unit ? <span className="text-xs font-normal text-admin-muted">{metric.unit}</span> : null}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-admin-muted">
          <span>{metric.detail}</span>
          {metric.trend ? (
            <span
              className={`font-bold ${metric.trendDirection === "down" ? "text-danger" : "text-admin-success"}`}
            >
              {metric.trendDirection === "down" ? "↓" : "↑"} {metric.trend}
            </span>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  );
}
