"use client";

import { Tabs } from "@heroui/react";
import { useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";

import { ExportPanel } from "./ExportPanel";
import {
  BranchesReportTab,
  CustomersReportTab,
  RevenueReportTab,
  StaffReportTab,
} from "./ReportTabs";
import { ReportRangePicker } from "./ReportRangePicker";
import {
  currentMonth,
  formatRangeLabel,
  isReportTabId,
  monthToRange,
  rangeProblem,
  recentMonths,
  reportTabs,
  type ReportRange,
  type ReportTabId,
} from "./normalize";

const MONTH_CHOICES = 12;

export function AdminReportsComponent() {
  const [tabId, setTabId] = useState<ReportTabId>("revenue");
  // `now` is captured once so a re-render never quietly slides the default
  // window forward under the salon's feet mid-session.
  const now = useMemo(() => new Date(), []);
  const [range, setRange] = useState<ReportRange>(() => monthToRange(currentMonth(now)));

  const months = useMemo(() => recentMonths(now, MONTH_CHOICES), [now]);
  const problem = rangeProblem(range);
  const rangeLabel = formatRangeLabel(range);
  const activeTab = reportTabs.find((tab) => tab.id === tabId) ?? reportTabs[0];

  return (
    <AdminPageLayout>
      <ReportRangePicker
        range={range}
        months={months}
        problem={problem}
        onRangeChange={setRange}
      />

      <Tabs
        selectedKey={tabId}
        onSelectionChange={(key) => {
          const next = String(key);
          if (isReportTabId(next)) setTabId(next);
        }}
        variant="secondary"
      >
        <Tabs.ListContainer className="max-w-full overflow-x-auto">
          <Tabs.List aria-label="Loại báo cáo">
            {reportTabs.map((tab) => (
              <Tabs.Tab key={tab.id} id={tab.id}>
                {tab.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <div className="mt-4 space-y-4">
        {problem ? (
          // Nothing is requested while the range is impossible: the backend
          // would only answer 422, so asking would cost a round trip to learn
          // what the picker already said.
          <p className="rounded-xl border border-dashed border-admin-border px-4 py-8 text-center text-sm text-admin-muted">
            Chỉnh lại khoảng thời gian để xem báo cáo.
          </p>
        ) : tabId === "revenue" ? (
          <RevenueReportTab range={range} rangeLabel={rangeLabel} />
        ) : tabId === "branches" ? (
          <BranchesReportTab range={range} rangeLabel={rangeLabel} />
        ) : tabId === "customers" ? (
          <CustomersReportTab range={range} rangeLabel={rangeLabel} />
        ) : (
          <StaffReportTab range={range} rangeLabel={rangeLabel} />
        )}

        <ExportPanel
          // Remounting per tab drops the previous tab's export state instead of
          // leaving a READY file from another report offered under this one.
          key={activeTab.exportType}
          reportType={activeTab.exportType}
          reportLabel={activeTab.label}
          range={range}
          isRangeValid={problem === null}
        />
      </div>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-reports" } as const;
