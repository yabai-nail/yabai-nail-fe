import { Card } from "@heroui/react";
import { monthlySummary } from "./data";

export function MonthlySummaryPanel() {
  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-4">
      <Card.Header className="px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">
          Thu nhập của quán <span className="font-normal text-admin-muted">(tháng 08/2026)</span>
        </h2>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <dl className="space-y-4">
          {monthlySummary.map((row) => (
            <div key={row.id} className="flex justify-between gap-4 text-xs">
              <dt className="text-admin-muted">{row.label}</dt>
              <dd className="font-semibold text-admin-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 border-t border-admin-border pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm font-bold text-admin-ink">Quán thực nhận</p>
            <p className="text-xl font-extrabold text-admin-accent">49.208.000 ₫</p>
          </div>
          <p className="mt-2 text-right text-xs text-admin-muted">Sau chi phí và hoa hồng</p>
        </div>
      </Card.Content>
    </Card>
  );
}
