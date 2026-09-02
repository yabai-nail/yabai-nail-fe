import { useTranslations } from "next-intl";
import { Avatar, Button, Card } from "@heroui/react";
import type { Appointment } from "./data";
import {
  appointmentStatusLabel,
  appointmentStatusTone,
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
  const t = useTranslations("admin.appointments");
  const tStatus = useTranslations("admin.appointmentStatus");
  return (
    <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="border-b border-admin-border px-4 py-3">
        <h2 className="text-sm font-bold text-admin-ink">{t("list.heading")}</h2>
      </Card.Header>
      <Card.Content className="p-0">
        {appointments.length ? (
          /*
            Three tiers, not one row. This column is 19rem wide, so the row had
            270px to seat six fields; five of them were shrink-0 and the two that
            actually vary in length — the customer's name and the service — split
            the 71px left over. "Sơn móng tay 1" wanted 87px of it. Down the
            tiers each of them gets the full width, and a Vietnamese name at its
            usual length fits without cutting. The clock is one range now
            (10:00 – 11:00) instead of a start on the left and an end floating on
            the right, and the status wears the same dot the calendar pills wear.
          */
          <ol className="divide-y divide-admin-border" aria-label={t("list.ariaLabel")}>
            {appointments.map((appointment) => {
              const tone = appointmentStatusTone[appointment.status];
              return (
                <li key={appointment.id} className={selectedId === appointment.id ? "bg-admin-soft" : undefined}>
                  <Button
                    variant="ghost"
                    className={`h-auto w-full justify-start rounded-none border-l-4 px-3 py-2.5 text-left ${tone.bar}`}
                    onPress={() => onSelect(appointment.id)}
                  >
                    <Avatar size="sm" color="accent" className="shrink-0"><Avatar.Fallback>{appointment.customer.initials}</Avatar.Fallback></Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <time dateTime={`${appointment.date}T${appointment.startTime}`} className="shrink-0 text-[0.7rem] font-bold text-admin-ink">
                          {appointment.startTime} – {appointment.endTime}
                        </time>
                        <span className="flex shrink-0 items-center gap-1 text-[0.65rem] text-admin-muted">
                          <span className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                          {appointmentStatusLabel(appointment.status, tStatus)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-semibold text-admin-ink">{appointment.customer.name}</span>
                      <span className="block truncate text-[0.7rem] text-admin-muted">{appointment.service.name}</span>
                    </span>
                  </Button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p role="status" className="px-4 py-12 text-center text-sm text-admin-muted">{t("list.empty")}</p>
        )}
      </Card.Content>
    </Card>
  );
}
