import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { appointments } from "./data";

export function AppointmentsPanel() {
  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-5">
      <Card.Header className="flex w-full flex-row items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">Lịch hẹn hôm nay</h2>
        <Button size="sm" variant="outline" className="rounded-lg border-admin-border">
          Xem lịch
        </Button>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        <ol aria-label="Danh sách lịch hẹn hôm nay" className="divide-y divide-admin-border">
          {appointments.map((appointment) => {
            const isConfirmed = appointment.status === "Đã xác nhận";

            return (
              <li
                key={appointment.id}
                className="grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-2 py-3 sm:grid-cols-[3.5rem_1fr_auto] sm:items-center"
              >
                <time className="text-sm font-bold text-admin-accent" dateTime={appointment.time}>
                  {appointment.time}
                </time>
                <div className="min-w-0 border-l border-admin-border pl-3">
                  <p className="truncate text-sm font-semibold text-admin-ink">{appointment.customer}</p>
                  <p className="mt-1 truncate text-xs text-admin-muted">{appointment.service}</p>
                </div>
                <Chip
                  size="sm"
                  variant="soft"
                  color={isConfirmed ? "accent" : "warning"}
                  className="col-start-2 w-fit sm:col-start-auto"
                >
                  <Chip.Label>{appointment.status}</Chip.Label>
                </Chip>
              </li>
            );
          })}
        </ol>

        <Button fullWidth variant="primary" className="mt-3 rounded-lg">
          <PlusIcon aria-hidden="true" className="size-5" />
          Thêm lịch hẹn
        </Button>
      </Card.Content>
    </Card>
  );
}
