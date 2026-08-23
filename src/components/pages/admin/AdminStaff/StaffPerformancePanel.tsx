"use client";

import { useMemo, useState } from "react";
import { formatVnd } from "@/lib/admin-format";
import { useAdminStaffPerformance } from "@/service";

// Branch-wide staff performance, filtered to the current staff. BE returns
// generic Record<string, unknown> rows so we normalise the two fields the
// panel actually renders — everything else stays untouched for future use.
function pickNumber(row: Record<string, unknown>, key: string): number | null {
  const value = row[key];
  return typeof value === "number" ? value : null;
}

function pickString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function currentMonthPeriod(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function StaffPerformancePanel({
  branchId,
  staffId,
}: Readonly<{ branchId: string; staffId: string }>) {
  const [period, setPeriod] = useState(currentMonthPeriod());
  const query = useAdminStaffPerformance(branchId, { period });
  const rows = useMemo(
    () => (query.data?.rows ?? []).filter((row) => pickString(row, "staffId") === staffId),
    [query.data, staffId],
  );
  const first = rows[0];
  const revenue = first ? pickNumber(first, "revenueVnd") ?? pickNumber(first, "revenue") : null;
  const orderCount = first ? pickNumber(first, "orderCount") ?? pickNumber(first, "count") : null;
  const commission = first ? pickNumber(first, "commissionVnd") ?? pickNumber(first, "commission") : null;

  return (
    <section aria-labelledby="staff-performance-heading" className="space-y-2 border-t border-admin-border pt-4">
      <div className="flex items-center justify-between">
        <h3 id="staff-performance-heading" className="text-sm font-bold text-admin-ink">Hiệu suất theo kỳ</h3>
        <input
          type="month"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="rounded-lg border border-admin-border bg-admin-surface px-2 py-1 text-xs text-admin-ink"
        />
      </div>

      {query.isLoading ? (
        <p className="text-xs text-admin-muted">Đang tải…</p>
      ) : query.error ? (
        <p role="alert" className="text-xs text-admin-danger">Không tải được hiệu suất.</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-admin-muted">Không có dữ liệu kỳ {period}.</p>
      ) : (
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-admin-soft p-3 text-center text-xs">
          <div>
            <dt className="text-admin-muted">Doanh thu</dt>
            <dd className="mt-1 font-bold text-admin-ink">
              {typeof revenue === "number" ? formatVnd(revenue) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-admin-muted">Số đơn</dt>
            <dd className="mt-1 font-bold text-admin-ink">{orderCount ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-admin-muted">Hoa hồng</dt>
            <dd className="mt-1 font-bold text-admin-accent">
              {typeof commission === "number" ? formatVnd(commission) : "—"}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
