export const DAY_START_HOUR = 9;
export const DAY_END_HOUR = 21;
export const MINUTES_PER_HOUR = 60;

type CalendarInterval = Readonly<{
  id: string;
  startTime: string;
  endTime: string;
}>;

export type DayAppointmentLayout<T extends CalendarInterval> = Readonly<{
  appointment: T;
  offsetMinutes: number;
  visibleDurationMinutes: number;
  lane: number;
  laneCount: number;
}>;

type VisibleInterval<T extends CalendarInterval> = Readonly<{
  appointment: T;
  startMinutes: number;
  endMinutes: number;
}>;

function parseTime(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return hour * MINUTES_PER_HOUR + minute;
}

function layoutCluster<T extends CalendarInterval>(
  cluster: readonly VisibleInterval<T>[],
): DayAppointmentLayout<T>[] {
  const laneEnds: number[] = [];
  const assigned = cluster.map((item) => {
    let lane = laneEnds.findIndex((endMinutes) => endMinutes <= item.startMinutes);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMinutes);
    } else {
      laneEnds[lane] = item.endMinutes;
    }
    return { item, lane };
  });
  const laneCount = laneEnds.length;

  return assigned.map(({ item, lane }) => ({
    appointment: item.appointment,
    offsetMinutes: item.startMinutes - DAY_START_HOUR * MINUTES_PER_HOUR,
    visibleDurationMinutes: item.endMinutes - item.startMinutes,
    lane,
    laneCount,
  }));
}

/**
 * Turns wall-clock appointment intervals into vertical offsets and overlap lanes for the
 * 09:00-21:00 day timeline. Intervals are half-open, so 10:00-11:00 and 11:00-12:00
 * are adjacent and may share a lane.
 */
export function layoutDayAppointments<T extends CalendarInterval>(
  appointments: readonly T[],
): DayAppointmentLayout<T>[] {
  const dayStart = DAY_START_HOUR * MINUTES_PER_HOUR;
  const dayEnd = DAY_END_HOUR * MINUTES_PER_HOUR;
  const visible = appointments
    .map((appointment): VisibleInterval<T> | null => {
      const rawStart = parseTime(appointment.startTime);
      const rawEnd = parseTime(appointment.endTime);
      if (rawStart === null || rawEnd === null || rawEnd <= rawStart) return null;

      const startMinutes = Math.max(rawStart, dayStart);
      const endMinutes = Math.min(rawEnd, dayEnd);
      return endMinutes > startMinutes ? { appointment, startMinutes, endMinutes } : null;
    })
    .filter((item): item is VisibleInterval<T> => item !== null)
    .toSorted(
      (left, right) =>
        left.startMinutes - right.startMinutes ||
        left.endMinutes - right.endMinutes ||
        left.appointment.id.localeCompare(right.appointment.id),
    );

  const result: DayAppointmentLayout<T>[] = [];
  let cluster: VisibleInterval<T>[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    result.push(...layoutCluster(cluster));
    cluster = [];
    clusterEnd = -1;
  };

  for (const item of visible) {
    if (cluster.length > 0 && item.startMinutes >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMinutes);
  }
  flush();

  return result;
}
