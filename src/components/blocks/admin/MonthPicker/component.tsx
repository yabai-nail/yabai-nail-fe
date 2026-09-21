"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, Popover } from "@heroui/react";
import { useLocale } from "next-intl";
import { useState } from "react";

/**
 * A month selector that matches the admin theme, replacing the browser's native
 * `<input type="month">` so every screen picks a month the same way (and the same way as
 * the appointment day picker). Value and onChange stay the plain "YYYY-MM" strings these
 * screens already hold; month names come from the active locale via Intl, so no message
 * catalogue keys are added. Screens that wrap it in prev/next arrows keep them.
 */

function parsePeriod(value: string): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month: month - 1 }; // Intl/Date months are 0-indexed.
}

function toPeriod(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function MonthPicker({
  value,
  onChange,
  ariaLabel,
  className,
}: Readonly<{
  value: string;
  onChange: (period: string) => void;
  ariaLabel?: string;
  className?: string;
}>) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const selected = parsePeriod(value);
  const [visibleYear, setVisibleYear] = useState(selected.year);

  // Re-centre on the selected year each time it opens.
  const handleOpenChange = (next: boolean) => {
    if (next) setVisibleYear(parsePeriod(value).year);
    setOpen(next);
  };

  const longFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const shortFormat = new Intl.DateTimeFormat(locale, { month: "short" });
  const triggerLabel = longFormat.format(new Date(selected.year, selected.month, 1));

  const now = new Date();
  const currentPeriod = toPeriod(now.getFullYear(), now.getMonth());

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange}>
      <Button
        variant="outline"
        onPress={() => handleOpenChange(!open)}
        aria-label={ariaLabel ?? triggerLabel}
        className={[
          "min-h-10 justify-center gap-2 rounded-lg border-admin-border bg-admin-surface px-3 text-sm font-semibold capitalize text-admin-ink",
          className ?? "",
        ].join(" ")}
      >
        {triggerLabel}
      </Button>
      <Popover.Content placement="bottom start" className="admin-shell z-50">
        <Popover.Dialog className="w-64 rounded-xl border border-admin-border bg-admin-surface p-3 text-admin-ink shadow-atelier outline-none">
          <div className="mb-2 flex items-center justify-between">
            <Button isIconOnly variant="ghost" className="rounded-lg" aria-label={String(visibleYear - 1)} onPress={() => setVisibleYear((year) => year - 1)}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-semibold tabular-nums">{visibleYear}</span>
            <Button isIconOnly variant="ghost" className="rounded-lg" aria-label={String(visibleYear + 1)} onPress={() => setVisibleYear((year) => year + 1)}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, month) => {
              const period = toPeriod(visibleYear, month);
              const isSelected = period === value;
              const isCurrent = period === currentPeriod;
              return (
                <button
                  key={month}
                  type="button"
                  aria-current={isSelected ? "date" : undefined}
                  onClick={() => {
                    onChange(period);
                    setOpen(false);
                  }}
                  className={[
                    "min-h-10 rounded-lg text-sm capitalize transition-colors",
                    isSelected
                      ? "bg-admin-accent font-semibold text-white"
                      : isCurrent
                        ? "border border-admin-accent font-semibold text-admin-ink hover:bg-admin-soft"
                        : "text-admin-ink hover:bg-admin-soft",
                  ].join(" ")}
                >
                  {shortFormat.format(new Date(visibleYear, month, 1))}
                </button>
              );
            })}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
