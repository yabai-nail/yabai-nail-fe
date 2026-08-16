import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Card, Dropdown } from "@heroui/react";
import { paymentMethods, revenueRows } from "./data";

export function RevenuePanel() {
  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-4">
      <Card.Header className="flex w-full flex-row items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">Doanh thu nhanh</h2>
        <Dropdown>
          <Dropdown.Trigger className="flex min-h-9 items-center gap-2 rounded-lg border border-admin-border px-3 text-xs font-medium text-admin-ink outline-none focus-visible:ring-2 focus-visible:ring-admin-accent">
            Hôm nay
            <ChevronDownIcon aria-hidden="true" className="size-4 text-admin-muted" />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="admin-shell">
            <Dropdown.Menu aria-label="Khoảng thời gian doanh thu">
              <Dropdown.Item id="today" textValue="Hôm nay">Hôm nay</Dropdown.Item>
              <Dropdown.Item id="week" textValue="Tuần này">Tuần này</Dropdown.Item>
              <Dropdown.Item id="month" textValue="Tháng này">Tháng này</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </Card.Header>

      <Card.Content className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <dl className="space-y-4">
          {revenueRows.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-admin-muted">{row.label}</dt>
              <dd className="shrink-0 font-semibold text-admin-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="my-5 border-t border-admin-border pt-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-admin-ink">Tiền quán thực nhận</p>
            <p className="text-lg font-bold text-admin-accent">3.082.000 ₫</p>
          </div>
        </div>

        <div className="rounded-xl bg-admin-soft/70 p-4">
          <h3 className="text-xs font-bold text-admin-ink">Doanh thu theo phương thức</h3>
          <dl className="mt-3 space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex justify-between gap-4 text-xs">
                <dt className="text-admin-muted">{method.label}</dt>
                <dd className="font-semibold text-admin-ink">{method.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card.Content>
    </Card>
  );
}
