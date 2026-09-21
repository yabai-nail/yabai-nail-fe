"use client";

import { useTranslations } from "next-intl";

import { formatMoney } from "@/lib/admin-format";
import { calculateAmountReceivedState } from "./payment-state";

const inputClassName = "min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:bg-admin-canvas disabled:text-admin-muted";

/** Records the amount staff verified on the PayPay terminal or VISA card reader. */
export function AmountReceivedPanel({ amountDue, value, disabled, onChange }: Readonly<{
  amountDue: number;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}>) {
  const t = useTranslations("admin.payments");
  const received = calculateAmountReceivedState(amountDue, value);

  return (
    <div className="mt-4 rounded-lg border border-admin-border bg-admin-soft p-3">
      <label htmlFor="amount-received" className="block text-xs font-semibold text-admin-ink">
        {t("confirm.amountReceived")}
        <input
          id="amount-received"
          className={`${inputClassName} mt-2`}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby="amount-received-feedback"
          aria-invalid={Boolean(received.error)}
        />
      </label>
      <p id="amount-received-feedback" aria-live="polite" className={`mt-2 text-xs ${received.error ? "text-admin-danger" : "text-admin-muted"}`}>
        {received.error ? t(received.error, { amount: formatMoney(amountDue) }) : t("confirm.amountReceivedMatches", { amount: formatMoney(received.amountReceived ?? 0) })}
      </p>
    </div>
  );
}
