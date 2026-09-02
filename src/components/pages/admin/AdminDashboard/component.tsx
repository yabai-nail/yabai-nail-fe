"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { useAdminBranch, useAdminDashboard } from "@/service";
import { AppointmentsPanel } from "./AppointmentsPanel";
import { MetricCard } from "./MetricCard";
import { MonthlySummaryPanel } from "./MonthlySummaryPanel";
import { RevenuePanel } from "./RevenuePanel";
import { StaffPanel } from "./StaffPanel";
import { UtilityPanel } from "./UtilityPanel";
import { buildDashboardMetrics } from "./adapters";
import type { DashboardMetric } from "./data";

export function AdminDashboardComponent() {
  const t = useTranslations("admin.dashboard");
  const { branchId } = useAdminBranch();
  const { data, isLoading, error } = useAdminDashboard(branchId);

  const metrics = useMemo<ReadonlyArray<DashboardMetric>>(
    () => buildDashboardMetrics(data?.kpi, isLoading || !branchId, error !== undefined, t),
    [data, isLoading, error, branchId, t],
  );

  return (
    <AdminPageLayout>
      <section aria-labelledby="today-overview-heading">
        <h2 id="today-overview-heading" className="sr-only">{t("overviewHeading")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      <section aria-label={t("activityRegion")} className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <AppointmentsPanel />
        <RevenuePanel />
        <UtilityPanel />
      </section>

      <section aria-label={t("performanceRegion")} className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <StaffPanel />
        <MonthlySummaryPanel />
      </section>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-dashboard" } as const;
