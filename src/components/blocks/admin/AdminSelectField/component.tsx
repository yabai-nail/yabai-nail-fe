"use client";

import { FunnelIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ListBox, Select } from "@heroui/react";

export type AdminSelectOption = {
  readonly value: string;
  readonly label: string;
};

type AdminSelectFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly options: ReadonlyArray<AdminSelectOption>;
  readonly onChange: (value: string) => void;
  /** Leading glyph. Defaults to the funnel used by the list filters. */
  readonly icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  readonly className?: string;
};

/**
 * The admin's dropdowns were bare `<select>` elements, so the open list was
 * drawn by the operating system: system font, system highlight, none of the
 * admin palette, and no way to style it. This renders the same choice through
 * the design system instead.
 *
 * `admin-shell` on the popover is required, not decorative — the popover
 * portals out of the admin subtree, and without the class it loses every
 * `--admin-*` token and renders on the wrong palette. BranchSelector does the
 * same thing for the same reason.
 */
export function _AdminSelectField({
  label,
  value,
  options,
  onChange,
  icon: Icon = FunnelIcon,
  className,
}: AdminSelectFieldProps) {
  return (
    <Select
      aria-label={label}
      selectedKey={value}
      onSelectionChange={(key) => {
        if (typeof key === "string") onChange(key);
      }}
      className={className}
    >
      <Select.Trigger className="flex min-h-10 items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 text-left text-sm font-medium text-admin-ink outline-none hover:bg-admin-soft focus-visible:ring-2 focus-visible:ring-admin-accent">
        <Icon aria-hidden className="size-4 shrink-0 text-admin-muted" />
        <Select.Value className="flex-1 truncate" />
        <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-admin-muted" />
      </Select.Trigger>
      <Select.Popover placement="bottom start" className="admin-shell">
        <ListBox aria-label={label}>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export const meta = { world: "pure", domain: "admin-select-field" } as const;
