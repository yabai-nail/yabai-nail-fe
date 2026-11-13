"use client";

import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

type AdminSelectionBarProps = {
  readonly count: number;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly onClear: () => void;
};

/** A sticky bar for bulk actions; the caller renders it only while something is selected. */
export function AdminSelectionBar({ count, actionLabel, onAction, onClear }: AdminSelectionBarProps) {
  const t = useTranslations("admin.common.selection");

  return (
    <div
      role="region"
      aria-live="polite"
      className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-admin-border bg-admin-soft px-4 py-3 shadow-sm"
    >
      <span className="text-sm font-medium text-admin-ink">{t("count", { count })}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onPress={onClear}>
          {t("clear")}
        </Button>
        <Button size="sm" variant="primary" onPress={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

export const meta = { world: "pure", domain: "admin-selection-bar" } as const;
