"use client";

import { useMemo } from "react";

import {
  useAdminBranchesReport,
  useAdminCustomersReport,
  useAdminStaffPerformanceReport,
  useRevenueReportRange,
} from "@/service";

import { ReportSection } from "./ReportSection";
import type { ReportRange } from "./normalize";

// One component per tab, and only the active one is mounted. The report hooks
// take no null id, so a single component holding all four would fire four
// requests on every range change instead of the one the salon is looking at.

type TabProps = {
  readonly range: ReportRange;
  readonly rangeLabel: string;
};

export function RevenueReportTab({ range, rangeLabel }: TabProps) {
  // These endpoints scope themselves to the caller's own role — there is no
  // branchId parameter — so `useAdminBranch()` has nothing to contribute here.
  const { data, isLoading, error } = useRevenueReportRange(range.from, range.to);
  return (
    <ReportSection
      title="Tổng hợp doanh thu"
      report={data}
      isLoading={isLoading}
      error={error}
      rangeLabel={rangeLabel}
      emptyRowsMessage="Chưa có chi nhánh nào phát sinh doanh thu trong khoảng này."
    />
  );
}

export function BranchesReportTab({ range, rangeLabel }: TabProps) {
  const query = useMemo(() => ({ from: range.from, to: range.to }), [range.from, range.to]);
  const { data, isLoading, error } = useAdminBranchesReport(query);
  return (
    <ReportSection
      title="Báo cáo theo chi nhánh"
      report={data}
      isLoading={isLoading}
      error={error}
      rangeLabel={rangeLabel}
      emptyRowsMessage="Chưa có chi nhánh nào trong phạm vi bạn được xem."
    />
  );
}

export function CustomersReportTab({ range, rangeLabel }: TabProps) {
  const query = useMemo(() => ({ from: range.from, to: range.to }), [range.from, range.to]);
  const { data, isLoading, error } = useAdminCustomersReport(query);
  return (
    <ReportSection
      title="Báo cáo khách hàng"
      report={data}
      isLoading={isLoading}
      error={error}
      rangeLabel={rangeLabel}
      // This report answers with aggregates only — the backend sends `segments`
      // and no per-customer rows — so an empty table here is normal, not a gap.
      emptyRowsMessage="Báo cáo khách hàng chỉ cung cấp số liệu tổng hợp, không có danh sách chi tiết."
    />
  );
}

export function StaffReportTab({ range, rangeLabel }: TabProps) {
  const query = useMemo(() => ({ from: range.from, to: range.to }), [range.from, range.to]);
  const { data, isLoading, error } = useAdminStaffPerformanceReport(query);
  return (
    <ReportSection
      title="Hiệu suất nhân viên"
      report={data}
      isLoading={isLoading}
      error={error}
      rangeLabel={rangeLabel}
      emptyRowsMessage="Chưa có nhân viên nào hoàn tất lịch hẹn trong khoảng này."
    />
  );
}
