"use client";

import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ListBox, Select } from "@heroui/react";
import type { ComponentType } from "react";

export type AdminSelectOption = {
  readonly value: string;
  readonly label: string;
};

type AdminSelectFieldProps = {
  /** Accessible name. Used as the aria-label when no visible label is wired via `id`. */
  readonly label: string;
  readonly value: string;
  readonly options: ReadonlyArray<AdminSelectOption>;
  readonly onChange: (value: string) => void;
  /** Leading glyph. Filters pass one; form fields pass none. */
  readonly icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  readonly fullWidth?: boolean;
  readonly id?: string;
  readonly isInvalid?: boolean;
  readonly describedBy?: string;
  readonly className?: string;
};

/**
 * The admin's dropdowns were bare `<select>` elements, so the open list was
 * drawn by the operating system: system font, system highlight, none of the
 * admin palette, and nothing a stylesheet could reach. This renders the same
 * choice through the design system instead.
 *
 * `admin-shell` on the popover is required, not decorative — the popover
 * portals out of the admin subtree, and without the class it loses every
 * `--admin-*` token and paints on the wrong palette. BranchSelector carries
 * the same class for the same reason.
 */
export function _AdminSelectField({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  fullWidth = false,
  id,
  isInvalid,
  describedBy,
  className,
}: AdminSelectFieldProps) {
  return (
    <Select
      id={id}
      aria-label={id ? undefined : label}
      selectedKey={value}
      onSelectionChange={(key) => {
        if (typeof key === "string") onChange(key);
      }}
      isInvalid={isInvalid}
      aria-describedby={describedBy}
      className={[fullWidth ? "w-full" : "", className ?? ""].filter(Boolean).join(" ") || undefined}
    >
      <Select.Trigger
        className={`flex min-h-11 items-center gap-2 rounded-lg border bg-admin-surface px-3 text-left text-sm font-medium text-admin-ink outline-none hover:bg-admin-soft focus-visible:ring-2 focus-visible:ring-admin-accent ${
          isInvalid ? "border-admin-danger" : "border-admin-border"
        } ${fullWidth ? "w-full" : ""}`}
      >
        {Icon ? <Icon aria-hidden className="size-4 shrink-0 text-admin-muted" /> : null}
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
