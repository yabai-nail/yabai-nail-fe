"use client";

import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { AdminDateField } from "@/components/blocks/admin/AdminDateField";
import { AdminTimeField } from "@/components/blocks/admin/AdminTimeField";
import { fromTokyoParts, saleWindowPreset, tokyoParts } from "./data";

const PRESETS = ["today", "weekend", "week"] as const;

type Window = { readonly startsAt: string; readonly endsAt: string };

/** One end of the window: a date and a time, entered in Tokyo time and kept as a UTC instant. */
function WhenField({
  legend,
  dateLabel,
  timeLabel,
  value,
  error,
  errorId,
  onChange,
}: Readonly<{
  legend: string;
  dateLabel: string;
  timeLabel: string;
  value: string;
  error: string | null;
  errorId: string;
  onChange: (iso: string) => void;
}>) {
  const parts = tokyoParts(value);
  return (
    <fieldset className="grid gap-2 text-sm">
      <legend className="mb-2 font-semibold text-admin-ink">{legend}</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
        <AdminDateField
          value={parts.date}
          ariaLabel={dateLabel}
          isInvalid={Boolean(error)}
          describedBy={error ? errorId : undefined}
          onChange={(date) => onChange(fromTokyoParts(date, parts.time))}
        />
        <AdminTimeField
          value={parts.time}
          ariaLabel={timeLabel}
          isInvalid={Boolean(error)}
          describedBy={error ? errorId : undefined}
          onChange={(time) => onChange(fromTokyoParts(parts.date, time))}
        />
      </div>
      {error ? <span id={errorId} className="text-xs text-admin-danger">{error}</span> : null}
    </fieldset>
  );
}

/** Start and end of a sale, with the quick presets "Hôm nay", "Cuối tuần này" and "7 ngày". */
export function SaleWindowFields({
  value,
  startError,
  endError,
  onChange,
}: Readonly<{ value: Window; startError: string | null; endError: string | null; onChange: (patch: Partial<Window>) => void }>) {
  const t = useTranslations("admin.sales.form");
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-admin-muted">{t("presets")}</span>
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant="outline"
            className="rounded-lg border-admin-border"
            onPress={() => onChange(saleWindowPreset(preset, new Date()))}
          >
            {t(`preset.${preset}`)}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <WhenField
          legend={t("start")}
          dateLabel={t("startDate")}
          timeLabel={t("startTime")}
          value={value.startsAt}
          error={startError}
          errorId="sale-start-error"
          onChange={(startsAt) => onChange({ startsAt })}
        />
        <WhenField
          legend={t("end")}
          dateLabel={t("endDate")}
          timeLabel={t("endTime")}
          value={value.endsAt}
          error={endError}
          errorId="sale-end-error"
          onChange={(endsAt) => onChange({ endsAt })}
        />
      </div>
      <p className="-mt-2 text-xs text-admin-muted">{t("timezone")}</p>
    </>
  );
}
