import { useTranslations } from "next-intl";
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
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  layoutDayAppointments,
  MINUTES_PER_HOUR,
} from "./calendar-layout";

const DAY_HOUR_HEIGHT_REM = 5;

function AppointmentPill({
  appointment,
  isSelected,
  onSelect,
  compact = false,
  timelineMinutes,
}: Readonly<{
  appointment: Appointment;
  isSelected: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
  timelineMinutes?: number;
}>) {
  // The status dresses the pill: a 4px bar to scan by, the same colour at 10%
  // behind it, and a dot beside the written label. The label prints in every
  // view, compact included — it used to be dropped there, which would now leave
  // the week grid encoding status in colour alone. Green and pink sit ΔE 4.7
  // apart for a deutan reader, so the label is what carries the meaning.
  const tStatus = useTranslations("admin.appointmentStatus");
  const tone = appointmentStatusTone[appointment.status];
  const statusLabel = appointmentStatusLabel(appointment.status, tStatus);
  const isTimeline = timelineMinutes !== undefined;
  const sizeClass = isTimeline
    ? "h-full min-h-0 overflow-hidden py-1"
    : compact
      ? "h-auto min-h-12 py-1.5"
      : "h-auto min-h-16 py-2";

  return (
    <Button
      variant="ghost"
      aria-label={`${appointment.customer.name}, ${appointment.service.name}, ${appointment.startTime} - ${appointment.endTime}, ${statusLabel}`}
      className={`w-full min-w-0 max-w-full items-start justify-start rounded-lg border-l-4 px-2 text-left ${tone.bar} ${tone.tint} ${sizeClass} ${
        isSelected ? "ring-2 ring-admin-ink/30" : ""
      }`}
      onPress={() => onSelect(appointment.id)}
    >
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="flex items-center justify-between gap-2">
          <strong className="truncate text-xs text-admin-ink">{appointment.customer.name}</strong>
          <time className="shrink-0 text-[0.65rem] text-admin-muted">{appointment.startTime} - {appointment.endTime}</time>
        </span>
        {!isTimeline || timelineMinutes >= 60 ? (
          <span className="mt-1 block truncate text-[0.7rem] text-admin-muted">{appointment.service.name}</span>
        ) : null}
        <span className="mt-1 flex items-center gap-1.5 text-[0.65rem] font-medium text-admin-ink">
          <span className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
          <span className="truncate">{statusLabel}</span>
        </span>
      </span>
    </Button>
  );
}

function DayCalendar({ appointments, selectedId, onSelect }: CalendarViewProps) {
  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, index) => index + DAY_START_HOUR,
  );
  const layouts = layoutDayAppointments(appointments);
  const timelineHeightRem = hours.length * DAY_HOUR_HEIGHT_REM;

  return (
    <div className="grid min-w-[34rem] grid-cols-[4rem_1fr]">
      <div aria-hidden="true">
        {hours.map((hour) => (
          <time key={hour} className="block h-20 border-b border-admin-border px-3 py-3 text-xs text-admin-muted last:border-b-0">
            {String(hour).padStart(2, "0")}:00
          </time>
        ))}
      </div>
      <div
        className="relative border-l border-admin-border"
        style={{ height: `${timelineHeightRem}rem` }}
      >
        <div className="absolute inset-0" aria-hidden="true">
          {hours.map((hour) => (
            <div key={hour} className="h-20 border-b border-admin-border last:border-b-0" />
          ))}
        </div>
        {layouts.map((layout) => {
          const topRem =
            (layout.offsetMinutes / MINUTES_PER_HOUR) * DAY_HOUR_HEIGHT_REM;
          const heightRem =
            (layout.visibleDurationMinutes / MINUTES_PER_HOUR) * DAY_HOUR_HEIGHT_REM;
          const laneWidth = 100 / layout.laneCount;

          return (
            <div
              key={layout.appointment.id}
              className={`absolute px-1 py-1 ${selectedId === layout.appointment.id ? "z-10" : "z-0"}`}
              style={{
                top: `${topRem}rem`,
                height: `${heightRem}rem`,
                left: `${layout.lane * laneWidth}%`,
                width: `${laneWidth}%`,
              }}
            >
              <AppointmentPill
                appointment={layout.appointment}
                isSelected={selectedId === layout.appointment.id}
                onSelect={onSelect}
                timelineMinutes={layout.visibleDurationMinutes}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekCalendar({ appointments, selectedDate, selectedId, onSelect }: CalendarViewProps) {
  const t = useTranslations("admin.appointments");
  const range = getAppointmentViewRange(selectedDate, "week");
  const dates = getDateKeysInRange(range.start, range.end);

  return (
    <div className="grid min-w-[54rem] grid-cols-7 divide-x divide-admin-border">
      {dates.map((date) => (
        <section key={date} className={date === selectedDate ? "bg-admin-soft/40" : undefined}>
          <h3 className={`border-b border-admin-border px-2 py-3 text-center text-xs font-semibold ${date === selectedDate ? "text-admin-accent" : "text-admin-muted"}`}>
            {formatShortWeekday(date, t)}
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
  const t = useTranslations("admin.appointments");
  const range = getAppointmentViewRange(selectedDate, "month");
  const dates = getDateKeysInRange(range.start, range.end);
  const leadingCells = (new Date(`${range.start}T00:00:00`).getDay() + 6) % 7;
  const cells = [...Array.from({ length: leadingCells }, () => null), ...dates];

  return (
    <div className="min-w-[48rem]">
      <div className="grid grid-cols-7 border-b border-admin-border text-center text-xs font-semibold text-admin-muted">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => <div key={day} className="py-3">{t(`weekday.long.${day}`)}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, index) => (
          <div key={date ?? `empty-${index}`} className={`min-h-28 border-b border-r border-admin-border p-2 ${date === selectedDate ? "bg-admin-soft/50" : ""}`}>
            {date ? (
              <>
                <span className={`text-xs font-semibold ${date === selectedDate ? "text-admin-accent" : "text-admin-muted"}`}>{Number(date.slice(-2))}</span>
                <div className="mt-1 space-y-1">
                  {appointments.filter((appointment) => appointment.date === date).slice(0, 3).map((appointment) => (
                    <Button key={appointment.id} variant="ghost" className={`h-auto min-h-7 w-full justify-start truncate rounded-md px-1.5 py-1 text-[0.65rem] ${selectedId === appointment.id ? "bg-admin-accent text-admin-on-accent" : "bg-admin-soft text-admin-accent"}`} onPress={() => onSelect(appointment.id)}>
                      {appointment.startTime} {appointment.customer.name}
                    </Button>
                  ))}
                  {appointments.filter((appointment) => appointment.date === date).length > 3 ? (
                    <p className="px-1 text-[0.65rem] font-semibold text-admin-muted">
                      {t("calendar.more", { count: appointments.filter((appointment) => appointment.date === date).length - 3 })}
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
  const t = useTranslations("admin.appointments");
  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-row items-center justify-between border-b border-admin-border px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-5 text-admin-accent" />
          <h2 className="text-sm font-bold text-admin-ink">{t(`calendar.${view}`)}</h2>
        </div>
        <Chip size="sm" variant="soft" color="accent"><Chip.Label>{t("calendar.count", { count: props.appointments.length })}</Chip.Label></Chip>
      </Card.Header>
      <Card.Content className="overflow-auto p-0">
        {view === "day" ? <DayCalendar {...props} /> : view === "week" ? <WeekCalendar {...props} /> : <MonthCalendar {...props} />}
      </Card.Content>
    </Card>
  );
}
