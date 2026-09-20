"use client";

import { useTranslations } from "next-intl";

import { formatMoney } from "@/lib/admin-format";
import { calculateCashTenderState } from "./payment-state";

const inputClassName = "min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:bg-admin-canvas disabled:text-admin-muted";

/** Keeps cash received and change visible before the employee opens confirmation. */
export function CashTenderPanel({ amountDue, value, disabled, onChange }: Readonly<{
  amountDue: number;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}>) {
  const t = useTranslations("admin.payments");
  const cash = calculateCashTenderState(amountDue, value);

  return (
    <div className="mt-4 grid gap-3 rounded-lg border border-admin-border bg-admin-soft p-3 sm:grid-cols-2">
      <label htmlFor="cash-tendered" className="block text-xs font-semibold text-admin-ink">
        {t("confirm.cashTendered")}
        <input
          id="cash-tendered"
          className={`${inputClassName} mt-2`}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby="cash-tender-feedback"
          aria-invalid={Boolean(cash.error)}
        />
      </label>
      <div className="flex min-h-16 flex-col justify-center rounded-lg border border-admin-border bg-admin-surface px-3 py-2">
        <span className="text-xs text-admin-muted">{t("confirm.cashChangeLabel")}</span>
        <strong className="mt-1 text-lg text-admin-accent">{cash.cashChange === null ? "—" : formatMoney(cash.cashChange)}</strong>
      </div>
      <p id="cash-tender-feedback" aria-live="polite" className={`text-xs sm:col-span-2 ${cash.error ? "text-admin-danger" : "text-admin-muted"}`}>
        {cash.error ? t(cash.error) : t("confirm.cashChange", { amount: formatMoney(cash.cashChange ?? 0) })}
      </p>
    </div>
  );
}
