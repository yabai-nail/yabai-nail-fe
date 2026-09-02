import { useTranslations } from "next-intl";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Card } from "@heroui/react";
import type { getAppointmentSummary } from "./appointment-state";

/**
 * Four of the five rows count a status, so they take their name from the shared status
 * catalogue instead of holding a second copy of it; only the total is this screen's own.
 */
const metrics = [
  { key: "total", statusKey: null, icon: CalendarDaysIcon, color: "text-admin-accent" },
  { key: "confirmed", statusKey: "CONFIRMED", icon: CheckCircleIcon, color: "text-admin-success" },
  { key: "pending", statusKey: "PENDING", icon: ClockIcon, color: "text-admin-warning" },
  { key: "completed", statusKey: "COMPLETED", icon: CheckCircleIcon, color: "text-admin-success" },
  { key: "cancelled", statusKey: "CANCELLED", icon: XCircleIcon, color: "text-admin-muted" },
] as const;

export function AppointmentSummary({ summary }: Readonly<{ summary: ReturnType<typeof getAppointmentSummary> }>) {
  const t = useTranslations("admin.appointments");
  const tStatus = useTranslations("admin.appointmentStatus");
  return (
    <Card className="mt-4 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="border-b border-admin-border px-4 py-3">
        <h2 className="text-sm font-bold text-admin-ink">{t("summary.heading")}</h2>
      </Card.Header>
      {/* One metric per row, not five tiles across. This card is 270px wide, so
          five columns gave each label 54px to live in and every label longer
          than that broke over two lines — t("summary.total") needs 78px. Down the
          page each label has the full width and none of them can wrap, however
          many metrics get added later.

          Still a grid, single column: card__content is a flex slot that centres
          its children, so a plain block or flex wrapper here would shrink to fit
          its text instead of filling the card. Grid items stretch. */}
      <Card.Content className="grid grid-cols-1 divide-y divide-admin-border p-0">
        {metrics.map(({ key, statusKey, icon: Icon, color }) => (
          <div key={key} className="flex items-center gap-3 px-4 py-2.5">
            <Icon className={`size-5 shrink-0 ${color}`} />
            <span className="flex-1 text-xs text-admin-muted">{statusKey ? tStatus(statusKey) : t("summary.total")}</span>
            {/* tabular-nums so the column of figures stays aligned once a
                two-digit day sits above a one-digit one. */}
            <strong className="text-lg tabular-nums text-admin-ink">{summary[key]}</strong>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
