"use client";

import { ClockIcon } from "@heroicons/react/24/outline";
import { Button, Popover } from "@heroui/react";
import { useMemo, useState } from "react";

/**
 * A form time field that opens a scrollable list of times instead of the browser's native
 * `<input type="time">` — closer to a mobile time picker and quicker to tap. Value/onChange
 * are the plain "HH:MM" strings the forms already use. Options step by `minuteStep`; a value
 * off the step (e.g. an existing appointment at 09:20) is merged in so it still shows selected.
 */

function buildOptions(step: number, current: string): string[] {
  const options: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    options.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }
  if (/^\d{2}:\d{2}$/.test(current) && !options.includes(current)) {
    options.push(current);
    options.sort();
  }
  return options;
}

export function AdminTimeField({
  value,
  onChange,
  id,
  ariaLabel,
  isInvalid,
  describedBy,
  minuteStep = 15,
  className,
}: Readonly<{
  value: string;
  onChange: (time: string) => void;
  id?: string;
  ariaLabel?: string;
  isInvalid?: boolean;
  describedBy?: string;
  minuteStep?: number;
  className?: string;
}>) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => buildOptions(minuteStep, value), [minuteStep, value]);

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button
        id={id}
        variant="outline"
        aria-label={ariaLabel}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        className={[
          "min-h-10 w-full justify-start gap-2 rounded-lg border-admin-border bg-admin-surface px-3 text-sm font-normal tabular-nums text-admin-ink",
          className ?? "",
        ].join(" ")}
      >
        <ClockIcon className="size-4 shrink-0 text-admin-muted" />
        <span>{value}</span>
      </Button>
      <Popover.Content placement="bottom start" className="admin-shell z-50">
        <Popover.Dialog className="w-40 rounded-xl border border-admin-border bg-admin-surface p-1 text-admin-ink shadow-atelier outline-none">
          <div
            ref={(element) => {
              if (!element) return;
              const active = element.children[options.indexOf(value)] as HTMLElement | undefined;
              if (active) element.scrollTop = active.offsetTop - element.clientHeight / 2 + active.clientHeight / 2;
            }}
            className="relative max-h-64 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                aria-current={option === value ? "time" : undefined}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={[
                  "block w-full rounded-lg px-3 py-2 text-left text-sm tabular-nums transition-colors",
                  option === value ? "bg-admin-accent font-semibold text-white" : "text-admin-ink hover:bg-admin-soft",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
