import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import type { Appointment, AppointmentView } from "./data";
import {
  formatShortWeekday,
  getAppointmentViewRange,
  getDateKeysInRange,
} from "./date-utils";
import {
  appointmentStatusLabel,
  appointmentStatusTone,
} from "./status";

function AppointmentPill({
  appointment,
  isSelected,
  onSelect,
  compact = false,
}: Readonly<{
  appointment: Appointment;
  isSelected: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
}>) {
  // The status dresses the pill: a 4px bar to scan by, the same colour at 10%
  // behind it, and a dot beside the written label. The label prints in every
  // view, compact included — it used to be dropped there, which would now leave
  // the week grid encoding status in colour alone. Green and pink sit ΔE 4.7
  // apart for a deutan reader, so the label is what carries the meaning.
  const tone = appointmentStatusTone[appointment.status];

  return (
    <Button
      variant="ghost"
      className={`h-auto w-full justify-start rounded-lg border-l-4 px-2 text-left ${tone.bar} ${tone.tint} ${
        compact ? "min-h-12 py-1.5" : "min-h-16 py-2"
      } ${isSelected ? "ring-2 ring-admin-ink/30" : ""}`}
      onPress={() => onSelect(appointment.id)}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <strong className="truncate text-xs text-admin-ink">{appointment.customer.name}</strong>
          <time className="shrink-0 text-[0.65rem] text-admin-muted">{appointment.startTime} - {appointment.endTime}</time>
        </span>
        <span className="mt-1 block truncate text-[0.7rem] text-admin-muted">{appointment.service.name}</span>
        <span className="mt-1 flex items-center gap-1.5 text-[0.65rem] font-medium text-admin-ink">
          <span className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
          {appointmentStatusLabel[appointment.status]}
        </span>
      </span>
    </Button>
  );
}

function DayCalendar({ appointments, selectedId, onSelect }: CalendarViewProps) {
  const hours = Array.from({ length: 12 }, (_, index) => index + 9);

  return (
    <div className="relative min-w-[34rem]">
      {hours.map((hour) => {
        const hourLabel = `${String(hour).padStart(2, "0")}:00`;
        const hourAppointments = appointments.filter(
          (appointment) => Number(appointment.startTime.slice(0, 2)) === hour,
        );
        return (
          <div key={hour} className="grid min-h-20 grid-cols-[4rem_1fr] border-b border-admin-border last:border-b-0">
            <time className="px-3 py-3 text-xs text-admin-muted">{hourLabel}</time>
            <div className="space-y-2 border-l border-admin-border p-2">
              {hourAppointments.map((appointment) => (
                <AppointmentPill key={appointment.id} appointment={appointment} isSelected={selectedId === appointment.id} onSelect={onSelect} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekCalendar({ appointments, selectedDate, selectedId, onSelect }: CalendarViewProps) {
  const range = getAppointmentViewRange(selectedDate, "week");
  const dates = getDateKeysInRange(range.start, range.end);

  return (
    <div className="grid min-w-[54rem] grid-cols-7 divide-x divide-admin-border">
      {dates.map((date) => (
        <section key={date} className={date === selectedDate ? "bg-admin-soft/40" : undefined}>
          <h3 className={`border-b border-admin-border px-2 py-3 text-center text-xs font-semibold ${date === selectedDate ? "text-admin-accent" : "text-admin-muted"}`}>
            {formatShortWeekday(date)}
          </h3>
          <div className="min-h-[36rem] space-y-2 p-2">
            {appointments.filter((appointment) => appointment.date === date).map((appointment) => (
              <AppointmentPill key={appointment.id} appointment={appointment} isSelected={selectedId === appointment.id} onSelect={onSelect} compact />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MonthCalendar({ appointments, selectedDate, selectedId, onSelect }: CalendarViewProps) {
  const range = getAppointmentViewRange(selectedDate, "month");
  const dates = getDateKeysInRange(range.start, range.end);
  const leadingCells = (new Date(`${range.start}T00:00:00`).getDay() + 6) % 7;
  const cells = [...Array.from({ length: leadingCells }, () => null), ...dates];

  return (
    <div className="min-w-[48rem]">
      <div className="grid grid-cols-7 border-b border-admin-border text-center text-xs font-semibold text-admin-muted">
        {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map((label) => <div key={label} className="py-3">{label}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, index) => (
          <div key={date ?? `empty-${index}`} className={`min-h-28 border-b border-r border-admin-border p-2 ${date === selectedDate ? "bg-admin-soft/50" : ""}`}>
            {date ? (
              <>
                <span className={`text-xs font-semibold ${date === selectedDate ? "text-admin-accent" : "text-admin-muted"}`}>{Number(date.slice(-2))}</span>
                <div className="mt-1 space-y-1">
                  {appointments.filter((appointment) => appointment.date === date).slice(0, 3).map((appointment) => (
                    <Button key={appointment.id} variant="ghost" className={`h-auto min-h-7 w-full justify-start truncate rounded-md px-1.5 py-1 text-[0.65rem] ${selectedId === appointment.id ? "bg-admin-accent text-white" : "bg-admin-soft text-admin-accent"}`} onPress={() => onSelect(appointment.id)}>
                      {appointment.startTime} {appointment.customer.name}
                    </Button>
                  ))}
                  {appointments.filter((appointment) => appointment.date === date).length > 3 ? (
                    <p className="px-1 text-[0.65rem] font-semibold text-admin-muted">
                      +{appointments.filter((appointment) => appointment.date === date).length - 3} lịch khác
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

type CalendarViewProps = Readonly<{
  appointments: ReadonlyArray<Appointment>;
  selectedDate: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}>;

export function AppointmentCalendar({ view, ...props }: CalendarViewProps & Readonly<{ view: AppointmentView }>) {
  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-row items-center justify-between border-b border-admin-border px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-5 text-admin-accent" />
          <h2 className="text-sm font-bold text-admin-ink">Lịch {view === "day" ? "ngày" : view === "week" ? "tuần" : "tháng"}</h2>
        </div>
        <Chip size="sm" variant="soft" color="accent"><Chip.Label>{props.appointments.length} lịch hẹn</Chip.Label></Chip>
      </Card.Header>
      <Card.Content className="overflow-auto p-0">
        {view === "day" ? <DayCalendar {...props} /> : view === "week" ? <WeekCalendar {...props} /> : <MonthCalendar {...props} />}
      </Card.Content>
    </Card>
  );
}
