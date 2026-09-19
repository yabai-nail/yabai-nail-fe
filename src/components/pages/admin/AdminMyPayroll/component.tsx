"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { MonthPicker } from "@/components/blocks/admin/MonthPicker";
import { formatMoney } from "@/lib/admin-format";
import { ApiClientError, useAdminMyPayroll } from "@/service";
import { currentMonth, formatPeriod, isMonth, shiftMonth } from "../AdminPayroll/data";

/**
 * A technician's own month: the same figures the Payroll screen shows the manager, read
 * from the caller's own row. Any login with a linked staff profile can open it, so the
 * owner and managers who serve customers see their own pay here too.
 */
export function AdminMyPayrollComponent() {
  const t = useTranslations("admin.myPayroll");
  const [period, setPeriod] = useState(() => currentMonth());
  const query = useAdminMyPayroll(isMonth(period) ? period : null);
  const row = query.data;
  const noProfile = query.error instanceof ApiClientError && query.error.code === "STAFF_PROFILE_REQUIRED";

  return (
    <AdminPageLayout>
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="flex items-center justify-center gap-1">
          <Button isIconOnly variant="ghost" aria-label={t("previousMonth")} onPress={() => setPeriod(shiftMonth(period, -1))}><ChevronLeftIcon className="size-5" /></Button>
          <MonthPicker value={period} onChange={setPeriod} ariaLabel={t("month")} className="min-h-11 text-base" />
          <Button isIconOnly variant="ghost" aria-label={t("nextMonth")} onPress={() => setPeriod(shiftMonth(period, 1))}><ChevronRightIcon className="size-5" /></Button>
        </div>

        {query.isLoading ? (
          <p className="text-center text-sm text-admin-muted">{t("loading")}</p>
        ) : noProfile ? (
          <p role="alert" className="rounded-lg bg-admin-soft px-4 py-3 text-sm text-admin-danger">{t("noProfile")}</p>
        ) : query.error ? (
          <p role="alert" className="text-center text-sm text-admin-danger">{t("loadFailed")}</p>
        ) : row ? (
          <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Header className="flex flex-col items-start gap-1 border-b border-admin-border px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-admin-muted">{t("heading", { period: formatPeriod(period) })}</span>
              <span className="text-3xl font-bold text-admin-accent">{formatMoney(row.payable)}</span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === "PAID" ? "bg-admin-soft text-admin-accent" : "bg-admin-soft text-admin-muted"}`}>
                {t(`status.${row.status}`)}{row.paidAt ? ` · ${t("paidOn", { date: row.paidAt.slice(0, 10) })}` : ""}
              </span>
            </Card.Header>
            <Card.Content className="grid grid-cols-2 gap-3 px-5 py-4 text-sm">
              <div><dt className="text-xs text-admin-muted">{t("approvedCount")}</dt><dd className="font-bold text-admin-ink">{row.approvedCount}</dd></div>
              <div><dt className="text-xs text-admin-muted">{t("gross")}</dt><dd className="font-bold text-admin-ink">{formatMoney(row.grossTotal)}</dd></div>
              <div><dt className="text-xs text-admin-muted">{t("fee")}</dt><dd className="font-bold text-admin-ink">{formatMoney(row.feeTotal)}</dd></div>
              <div><dt className="text-xs text-admin-muted">{t("commission")}</dt><dd className="font-bold text-admin-accent">{formatMoney(row.staffTotal)}</dd></div>
              <div><dt className="text-xs text-admin-muted">{t("baseSalary")}</dt><dd className="font-bold text-admin-ink">{formatMoney(row.baseSalary)}</dd></div>
              <div><dt className="text-xs text-admin-muted">{t("salon")}</dt><dd className="font-bold text-admin-ink">{formatMoney(row.salonTotal)}</dd></div>
            </Card.Content>
            <Card.Footer className="border-t border-admin-border px-5 py-3 text-xs text-admin-muted">{t("hint")}</Card.Footer>
          </Card>
        ) : null}
      </div>
    </AdminPageLayout>
  );
}
