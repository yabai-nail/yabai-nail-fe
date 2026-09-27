"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { monthCells, toggleWeekdayColumn } from "./shift-dates";

// Monday-first weekday numbers (Date#getUTCDay), labelled from a reference week:
// 2024-01-01 is a Monday, so weekday n falls on 2024-01-n (Sunday on the 7th).
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];
const weekdayReference = (weekday: number) => new Date(Date.UTC(2024, 0, weekday === 0 ? 7 : weekday, 12));

/**
 * An always-open month grid for picking work days: each tap toggles a day, a weekday header
 * toggles that whole column, days before today or already rostered cannot be picked. What is
 * highlighted is exactly what will be saved, so the admin never has to imagine a date range.
 */
export function ShiftDayCalendar({
  month,
  onMonthChange,
  selected,
  onSelectedChange,
  today,
  takenDates,
}: Readonly<{
  month: { year: number; month: number };
  onMonthChange: (month: { year: number; month: number }) => void;
  selected: ReadonlySet<string>;
  onSelectedChange: (next: Set<string>) => void;
  today: string;
  takenDates: ReadonlySet<string>;
}>) {
  const t = useTranslations("admin.staff");
  const locale = useLocale();
  const cells = monthCells(month.year, month.month);
  const isPickable = (date: string) => date >= today && !takenDates.has(date);

  const titleFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const dayFormat = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const monthAt = (offset: number) => new Date(Date.UTC(month.year, month.month + offset, 1));
  const step = (offset: number) => {
    const next = monthAt(offset);
    onMonthChange({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };

  function toggleDay(date: string) {
    const next = new Set(selected);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    onSelectedChange(next);
  }

  return (
    <div className="rounded-xl border border-admin-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <Button isIconOnly size="sm" variant="ghost" className="rounded-lg" aria-label={titleFormat.format(monthAt(-1))} onPress={() => step(-1)}>
          <ChevronLeftIcon className="size-4" />
        </Button>
        <span className="text-sm font-bold capitalize text-admin-ink">{titleFormat.format(monthAt(0))}</span>
        <Button isIconOnly size="sm" variant="ghost" className="rounded-lg" aria-label={titleFormat.format(monthAt(1))} onPress={() => step(1)}>
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <button
            key={weekday}
            type="button"
            title={t("shifts.pickColumn")}
            onClick={() => onSelectedChange(toggleWeekdayColumn(selected, cells, weekday, isPickable))}
            className="h-7 rounded-md text-xs font-semibold capitalize text-admin-muted transition-colors hover:bg-admin-soft hover:text-admin-ink"
          >
            {weekdayFormat.format(weekdayReference(weekday))}
          </button>
        ))}
        {cells.map((date, index) => {
          if (date === null) return <span key={`blank-${index}`} aria-hidden="true" />;
          const taken = takenDates.has(date);
          const past = date < today;
          const on = selected.has(date);
          const label = dayFormat.format(new Date(`${date}T12:00:00Z`));
          return (
            <button
              key={date}
              type="button"
              disabled={past || taken}
              aria-pressed={on}
              aria-label={taken ? t("shifts.takenDay", { date: label }) : label}
              onClick={() => toggleDay(date)}
              className={[
                "relative flex h-10 items-center justify-center rounded-lg text-sm tabular-nums transition-colors",
                on
                  ? "bg-admin-accent font-bold text-white"
                  : taken
                    ? "cursor-not-allowed bg-admin-soft font-semibold text-admin-muted"
                    : past
                      ? "cursor-not-allowed text-admin-muted/40"
                      : "border border-admin-border text-admin-ink hover:border-admin-accent hover:bg-admin-soft",
              ].join(" ")}
            >
              {Number(date.slice(8))}
              {taken ? <span aria-hidden="true" className="absolute bottom-1 size-1 rounded-full bg-admin-accent" /> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-admin-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded bg-admin-accent" />
          {t("shifts.legendSelected")}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="relative flex size-3 items-end justify-center rounded bg-admin-soft">
            <span className="mb-0.5 size-1 rounded-full bg-admin-accent" />
          </span>
          {t("shifts.legendTaken")}
        </span>
      </div>
    </div>
  );
}
