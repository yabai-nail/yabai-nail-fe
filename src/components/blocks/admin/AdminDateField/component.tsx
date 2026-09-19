"use client";

import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, Popover } from "@heroui/react";
import { useLocale } from "next-intl";
import { useState } from "react";

/**
 * A form date field that opens a themed month calendar instead of the browser's native
 * `<input type="date">`, so picking a day looks and behaves the same across admin screens.
 * Value/onChange are the plain "YYYY-MM-DD" strings the forms already hold; weekday and
 * month names come from the active locale via Intl, so no message-catalogue keys are added.
 */

function parseKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// A Monday-first reference week (2024-01-01 is a Monday) for the weekday header labels.
const WEEKDAY_REFERENCE = Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 1 + index));

export function AdminDateField({
  value,
  onChange,
  id,
  ariaLabel,
  isInvalid,
  describedBy,
  className,
}: Readonly<{
  value: string;
  onChange: (dateKey: string) => void;
  id?: string;
  ariaLabel?: string;
  isInvalid?: boolean;
  describedBy?: string;
  className?: string;
}>) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const selected = parseKey(value);
  const [visibleMonth, setVisibleMonth] = useState(() => ({ year: selected.getFullYear(), month: selected.getMonth() }));

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const current = parseKey(value);
      setVisibleMonth({ year: current.getFullYear(), month: current.getMonth() });
    }
    setOpen(next);
  };

  const stepMonth = (direction: -1 | 1) =>
    setVisibleMonth((current) => {
      const next = new Date(current.year, current.month + direction, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const firstOfMonth = new Date(visibleMonth.year, visibleMonth.month, 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(visibleMonth.year, visibleMonth.month + 1, 0).getDate();
  const cells: Array<string | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => toKey(new Date(visibleMonth.year, visibleMonth.month, index + 1))),
  ];

  const dateFormat = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  const titleFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const todayKey = toKey(new Date());

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange}>
      <Button
        id={id}
        variant="outline"
        aria-label={ariaLabel}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        className={[
          "min-h-10 w-full justify-start gap-2 rounded-lg border-admin-border bg-admin-surface px-3 text-sm font-normal text-admin-ink",
          className ?? "",
        ].join(" ")}
      >
        <CalendarDaysIcon className="size-4 shrink-0 text-admin-muted" />
        <span>{dateFormat.format(selected)}</span>
      </Button>
      <Popover.Content placement="bottom start" className="admin-shell z-50">
        <Popover.Dialog className="w-72 rounded-xl border border-admin-border bg-admin-surface p-3 text-admin-ink shadow-atelier outline-none">
          <div className="mb-2 flex items-center justify-between">
            <Button isIconOnly variant="ghost" className="rounded-lg" aria-label={titleFormat.format(new Date(visibleMonth.year, visibleMonth.month - 1, 1))} onPress={() => stepMonth(-1)}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-semibold capitalize">{titleFormat.format(firstOfMonth)}</span>
            <Button isIconOnly variant="ghost" className="rounded-lg" aria-label={titleFormat.format(new Date(visibleMonth.year, visibleMonth.month + 1, 1))} onPress={() => stepMonth(1)}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-semibold capitalize text-admin-muted">
            {WEEKDAY_REFERENCE.map((day, index) => (
              <span key={index}>{weekdayFormat.format(day)}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateKey, index) =>
              dateKey === null ? (
                <span key={`blank-${index}`} aria-hidden="true" />
              ) : (
                <button
                  key={dateKey}
                  type="button"
                  aria-current={dateKey === value ? "date" : undefined}
                  onClick={() => {
                    onChange(dateKey);
                    setOpen(false);
                  }}
                  className={[
                    "flex h-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors",
                    dateKey === value
                      ? "bg-admin-accent font-semibold text-white"
                      : dateKey === todayKey
                        ? "border border-admin-accent font-semibold text-admin-ink hover:bg-admin-soft"
                        : "text-admin-ink hover:bg-admin-soft",
                  ].join(" ")}
                >
                  {parseKey(dateKey).getDate()}
                </button>
              ),
            )}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
