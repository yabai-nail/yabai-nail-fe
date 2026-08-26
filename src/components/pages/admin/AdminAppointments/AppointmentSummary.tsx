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
  { key: "completed", label: "Hoàn tất", icon: CheckCircleIcon, color: "text-admin-success" },
  { key: "cancelled", label: "Đã hủy", icon: XCircleIcon, color: "text-admin-muted" },
] as const;

export function AppointmentSummary({ summary }: Readonly<{ summary: ReturnType<typeof getAppointmentSummary> }>) {
  // overflow-hidden on the card because the tile grid paints its own background
  // to draw the rules: without it those square corners sit outside the card's
  // radius and the bottom two corners read as broken.
  return (
    <Card className="mt-4 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="border-b border-admin-border px-4 py-3">
        <h2 className="text-sm font-bold text-admin-ink">Tổng quan ngày</h2>
      </Card.Header>
      {/* Five tiles on one row, and the label wraps rather than the grid.
          Wrapping the grid was the wrong lever twice over: it left the last row
          short, so the empty track painted the rule colour as a solid block, and
          a per-tile border-r only lines up while every tile shares one row.
          A fixed five columns can never leave a gap, so a 1px gap over a
          border-coloured background draws every rule correctly; the card is
          narrow, so the labels take two lines and that is fine. */}
      <Card.Content className="grid grid-cols-5 gap-px bg-admin-border p-0">
        {metrics.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-admin-surface px-1.5 py-4 text-center">
            <Icon className={`mx-auto size-5 ${color}`} />
            <strong className="mt-2 block text-lg text-admin-ink">{summary[key]}</strong>
            <span className="mt-1 block text-[0.68rem] leading-tight text-admin-muted">{label}</span>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
