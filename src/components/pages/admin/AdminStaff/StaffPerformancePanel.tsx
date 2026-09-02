"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/admin-format";
import { currentMonthPeriod, indexStaffPerformance } from "@/lib/admin-staff-performance";
import { useAdminStaffPerformance } from "@/service";

const MISSING = "—";

// Branch-wide staff performance, filtered to the current staff. The rows are
// keyed by `staff.id`, not a flat `staffId`, so the lookup goes through the
// shared reader that the staff table above this panel also uses — otherwise
// the two disagree about the same period.
export function StaffPerformancePanel({
  branchId,
  staffId,
}: Readonly<{ branchId: string; staffId: string }>) {
  const t = useTranslations("admin.staff");
  const [period, setPeriod] = useState(() => currentMonthPeriod(new Date()));
  const query = useAdminStaffPerformance(branchId, { period });
  const row = useMemo(
    () => indexStaffPerformance(query.data?.rows).get(staffId),
    [query.data, staffId],
  );

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
        <p className="text-xs text-admin-muted">Không có dữ liệu kỳ {period}.</p>
      ) : (
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-admin-soft p-3 text-center text-xs">
          <div>
            <dt className="text-admin-muted">Doanh thu</dt>
            <dd className="mt-1 font-bold text-admin-ink">
              {typeof row.revenue === "number" ? formatMoney(row.revenue) : MISSING}
            </dd>
          </div>
          <div>
            <dt className="text-admin-muted">{t("performance.orders")}</dt>
            <dd className="mt-1 font-bold text-admin-ink">{row.orderCount ?? MISSING}</dd>
          </div>
          <div>
            <dt className="text-admin-muted">{t("performance.commission")}</dt>
            <dd className="mt-1 font-bold text-admin-accent">
              {typeof row.commissionAmount === "number" ? formatMoney(row.commissionAmount) : MISSING}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
