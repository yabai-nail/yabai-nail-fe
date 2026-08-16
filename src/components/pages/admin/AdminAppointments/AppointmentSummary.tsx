import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Card } from "@heroui/react";
import type { getAppointmentSummary } from "./appointment-state";

const metrics = [
  { key: "total", label: "Tổng lịch hẹn", icon: CalendarDaysIcon, color: "text-admin-accent" },
  { key: "confirmed", label: "Đã xác nhận", icon: CheckCircleIcon, color: "text-admin-success" },
  { key: "pending", label: "Chờ xác nhận", icon: ClockIcon, color: "text-admin-warning" },
  { key: "cancelled", label: "Đã hủy", icon: XCircleIcon, color: "text-admin-muted" },
] as const;

export function AppointmentSummary({ summary }: Readonly<{ summary: ReturnType<typeof getAppointmentSummary> }>) {
  return (
    <Card className="mt-4 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="border-b border-admin-border px-4 py-3">
        <h2 className="text-sm font-bold text-admin-ink">Tổng quan ngày</h2>
      </Card.Header>
      <Card.Content className="grid grid-cols-2 divide-admin-border p-0 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="border-r border-admin-border px-2 py-4 text-center last:border-r-0">
            <Icon className={`mx-auto size-5 ${color}`} />
            <strong className="mt-2 block text-lg text-admin-ink">{summary[key]}</strong>
            <span className="mt-1 block whitespace-nowrap text-[0.68rem] text-admin-muted">{label}</span>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
