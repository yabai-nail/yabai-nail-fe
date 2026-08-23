"use client";

import { useMemo } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { useAdminBranch, useAdminDashboard } from "@/service";
import { AppointmentsPanel } from "./AppointmentsPanel";
import { MetricCard } from "./MetricCard";
import { MonthlySummaryPanel } from "./MonthlySummaryPanel";
import { RevenuePanel } from "./RevenuePanel";
import { StaffPanel } from "./StaffPanel";
import { UtilityPanel } from "./UtilityPanel";
import { dashboardMetrics, type DashboardMetric } from "./data";

function buildAppointmentMetric(
  base: DashboardMetric,
  data: { total: number; confirmed: number; inService: number; completed: number } | undefined,
  isLoading: boolean,
  hasError: boolean,
): DashboardMetric {
  if (hasError) return { ...base, value: "—", detail: "Không tải được dữ liệu hôm nay" };
  if (isLoading || !data) return { ...base, value: "…", detail: "Đang tải…" };

  const pending = Math.max(0, data.total - data.confirmed - data.inService - data.completed);
  return {
    ...base,
    value: String(data.total),
    detail: `Đã xác nhận: ${data.confirmed} · Đang phục vụ: ${data.inService} · Hoàn tất: ${data.completed}${pending > 0 ? ` · Chờ: ${pending}` : ""}`,
  };
}

export function AdminDashboardComponent() {
  const { branchId } = useAdminBranch();
  const { data, isLoading, error } = useAdminDashboard(branchId);

  const metrics = useMemo<ReadonlyArray<DashboardMetric>>(() => {
    const appointmentBase = dashboardMetrics.find((metric) => metric.id === "appointments");
    if (!appointmentBase) return dashboardMetrics;

    const liveAppointment = buildAppointmentMetric(
      appointmentBase,
      data?.kpi,
      isLoading,
      error !== undefined,
    );

    // Only the first card is wired today; revenue / customers / staff stay on
    // fixture data until the platform exposes matching KPI endpoints. Keeping
    // the layout intact avoids a half-empty dashboard.
    return dashboardMetrics.map((metric) =>
      metric.id === "appointments" ? liveAppointment : metric,
    );
  }, [data, isLoading, error]);

  return (
    <AdminPageLayout>
      <section aria-labelledby="today-overview-heading">
        <h2 id="today-overview-heading" className="sr-only">Tổng quan hôm nay</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      <section aria-label="Hoạt động cửa hàng" className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <AppointmentsPanel />
        <RevenuePanel />
        <UtilityPanel />
      </section>

      <section aria-label="Hiệu suất nhân viên và thu nhập tháng" className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <StaffPanel />
        <MonthlySummaryPanel />
      </section>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-dashboard" } as const;
