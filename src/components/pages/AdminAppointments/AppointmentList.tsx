import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Card, Chip } from "@heroui/react";
import type { Appointment } from "./data";
import {
  appointmentStatusColor,
  appointmentStatusLabel,
} from "./status";

export function AppointmentList({
  appointments,
  selectedId,
  onSelect,
}: Readonly<{
  appointments: ReadonlyArray<Appointment>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}>) {
  return (
    <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="border-b border-admin-border px-4 py-3">
        <h2 className="text-sm font-bold text-admin-ink">Danh sách lịch hẹn</h2>
      </Card.Header>
      <Card.Content className="p-0">
        {appointments.length ? (
          <ol className="divide-y divide-admin-border" aria-label="Lịch hẹn trong ngày đã chọn">
            {appointments.map((appointment) => (
              <li key={appointment.id} className={selectedId === appointment.id ? "bg-admin-soft" : undefined}>
                <Button
                  variant="ghost"
                  className="h-auto min-h-20 w-full justify-start rounded-none px-3 py-3 text-left"
                  onPress={() => onSelect(appointment.id)}
                >
                  <time dateTime={`${appointment.date}T${appointment.startTime}`} className="w-12 shrink-0 self-start pt-1 text-sm font-bold text-admin-accent">
                    {appointment.startTime}
                  </time>
                  <Avatar size="sm" color="accent"><Avatar.Fallback>{appointment.customer.initials}</Avatar.Fallback></Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-admin-ink">{appointment.customer.name}</span>
                    <span className="mt-1 block truncate text-xs text-admin-muted">{appointment.service.name}</span>
                  </span>
                  <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <Chip size="sm" variant="soft" color={appointmentStatusColor[appointment.status]}>
                      <Chip.Label>{appointmentStatusLabel[appointment.status]}</Chip.Label>
                    </Chip>
                    <span className="text-xs text-admin-muted">{appointment.endTime}</span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-admin-muted" />
                </Button>
              </li>
            ))}
          </ol>
        ) : (
          <p role="status" className="px-4 py-12 text-center text-sm text-admin-muted">Không có lịch hẹn phù hợp.</p>
        )}
      </Card.Content>
    </Card>
  );
}
