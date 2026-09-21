"use client";

import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, Popover } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * The date navigator's middle control: it still shows the current date the way the plain
 * label did, but clicking it opens a month grid so an admin can jump straight to a day
 * instead of stepping through them one arrow-press at a time. The prev/next buttons around
 * it are unchanged. Dates are the same "YYYY-MM-DD" strings the rest of the screen uses, so
 * no date library and no timezone maths creep in here.
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

// Monday-first columns, kept as JS getDay() values (0 = Sunday) so the headers reuse the
// shared weekday catalogue the rest of the screen already reads from.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function AppointmentDatePicker({
  value,
  label,
  today,
  onChange,
}: Readonly<{
  value: string;
  label: string;
  today?: string;
  onChange: (dateKey: string) => void;
}>) {
  const t = useTranslations("admin.appointments");
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseKey(value);
    return { year: selected.getFullYear(), month: selected.getMonth() };
  });

  // Re-centre on the selected month every time it opens, so it never reappears wherever the
  // admin last browsed to without picking anything.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      const selected = parseKey(value);
      setVisibleMonth({ year: selected.getFullYear(), month: selected.getMonth() });
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
    ...Array.from({ length: daysInMonth }, (_, index) =>
      toKey(new Date(visibleMonth.year, visibleMonth.month, index + 1)),
    ),
  ];

  const mobileLabel = label.split(/\s*[(（]/)[0];

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange}>
      <Button
        variant="outline"
        onPress={() => handleOpenChange(!open)}
        aria-label={label}
        className="min-h-10 w-full min-w-0 justify-start gap-2 rounded-lg border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-ink sm:w-auto"
      >
        <CalendarDaysIcon className="size-4 shrink-0 text-admin-muted" />
        <span className="truncate sm:hidden">{mobileLabel}</span>
        <span className="hidden truncate sm:inline">{label}</span>
      </Button>
      <Popover.Content placement="bottom start" className="admin-shell z-50">
        <Popover.Dialog className="w-72 rounded-xl border border-admin-border bg-admin-surface p-3 text-admin-ink shadow-atelier outline-none">
          <div className="mb-2 flex items-center justify-between">
            <Button isIconOnly variant="ghost" className="rounded-lg" aria-label={t("toolbar.previous")} onPress={() => stepMonth(-1)}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-semibold">
              {t("monthLabel", { month: visibleMonth.month + 1, year: String(visibleMonth.year) })}
            </span>
            <Button isIconOnly variant="ghost" className="rounded-lg" aria-label={t("toolbar.next")} onPress={() => stepMonth(1)}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-admin-muted">
            {WEEKDAY_ORDER.map((weekday) => (
              <span key={weekday}>{t(`weekday.short.${weekday}`)}</span>
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
                      : dateKey === today
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
