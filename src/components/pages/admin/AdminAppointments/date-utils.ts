import type { AppointmentView } from "./data";

const dayNames = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
] as const;

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatNumericDate(value: string, includeYear = true) {
  const [year, month, day] = value.split("-");
  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

export function shiftAppointmentDate(
  value: string,
  view: AppointmentView,
  direction: -1 | 1,
) {
  const date = parseDate(value);

  if (view === "month") {
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + direction);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    date.setDate(Math.min(originalDay, lastDay));
  } else {
    date.setDate(date.getDate() + direction * (view === "week" ? 7 : 1));
  }

  return toDateKey(date);
}

export function getAppointmentViewRange(
  value: string,
  view: AppointmentView,
) {
  const selected = parseDate(value);

  if (view === "day") {
    return { start: value, end: value };
  }

  if (view === "month") {
    return {
      start: toDateKey(new Date(selected.getFullYear(), selected.getMonth(), 1)),
      end: toDateKey(
        new Date(selected.getFullYear(), selected.getMonth() + 1, 0),
      ),
    };
  }

  const mondayOffset = (selected.getDay() + 6) % 7;
  const start = new Date(selected);
  start.setDate(start.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function formatAppointmentDateLabel(
  value: string,
  view: AppointmentView,
) {
  const date = parseDate(value);

  if (view === "day") {
    return `${formatNumericDate(value)} (${dayNames[date.getDay()]})`;
  }

  if (view === "month") {
    return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  const { start, end } = getAppointmentViewRange(value, view);
  return `${formatNumericDate(start, false)} - ${formatNumericDate(end)}`;
}

export function getDateKeysInRange(start: string, end: string) {
  const keys: string[] = [];
  const cursor = parseDate(start);
  const endDate = parseDate(end);

  while (cursor <= endDate) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

export function formatShortWeekday(value: string) {
  const date = parseDate(value);
  return `${dayNames[date.getDay()].replace("Thứ ", "T")}, ${date.getDate()}/${date.getMonth() + 1}`;
}
