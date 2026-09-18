"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatMoney } from "@/lib/admin-format";
import { currentMonthPeriod } from "@/lib/admin-staff-performance";
import { useAdminPayroll } from "@/service";

const MISSING = "—";

/**
 * One technician's month, read from the payroll sheet of their branch: the approved
 * per-customer reports are the source of pay now (platform docs/payroll-sales-reports.md),
 * so this panel shows the same numbers the Payroll screen and the payout do — not the old
 * per-booking commission ledger, which no longer feeds payroll.
 */
export function StaffPerformancePanel({
  branchId,
  staffId,
}: Readonly<{ branchId: string; staffId: string }>) {
  const t = useTranslations("admin.staff");
  const [period, setPeriod] = useState(() => currentMonthPeriod(new Date()));
  const query = useAdminPayroll({ branchId, period });
  const row = query.data?.rows.find((item) => item.staffId === staffId);

  return (
    <section aria-labelledby="staff-performance-heading" className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 id="staff-performance-heading" className="text-sm font-bold text-admin-ink">{t("performance.heading")}</h3>
        <input
          type="month"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          aria-label={t("performance.periodLabel")}
          className="rounded-lg border border-admin-border bg-admin-surface px-2 py-1 text-xs text-admin-ink"
        />
      </div>

      {query.isLoading ? (
        <p className="text-xs text-admin-muted">{t("performance.loading")}</p>
      ) : query.error ? (
        <p role="alert" className="text-xs text-admin-danger">{t("performance.loadFailed")}</p>
      ) : !row ? (
        <p className="text-xs text-admin-muted">{t("performance.empty", { period })}</p>
      ) : (
        <dl className="grid grid-cols-2 gap-2 rounded-lg bg-admin-soft p-3 text-center text-xs sm:grid-cols-4">
          <div>
            <dt className="text-admin-muted">{t("performance.revenue")}</dt>
            <dd className="mt-1 font-bold text-admin-ink">{formatMoney(row.grossTotal)}</dd>
          </div>
          <div>
            <dt className="text-admin-muted">{t("performance.approved")}</dt>
            <dd className="mt-1 font-bold text-admin-ink">{row.approvedCount || MISSING}</dd>
          </div>
          <div>
            <dt className="text-admin-muted">{t("performance.commission")}</dt>
            <dd className="mt-1 font-bold text-admin-accent">{formatMoney(row.staffTotal)}</dd>
          </div>
          <div>
            <dt className="text-admin-muted">{t("performance.payable")}</dt>
            <dd className="mt-1 font-bold text-admin-ink">{formatMoney(row.payable)}</dd>
            <dd className="text-admin-muted">{t(`performance.payrollStatus.${row.status}`)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
