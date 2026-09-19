"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { AppointmentCustomer } from "./data";

/**
 * Customer chooser for the appointment form, shown as a searchable table of name + phone
 * rather than a name-only dropdown: two customers can share a name, so the phone is what tells
 * them apart. Search matches the name or the phone (digits only, so spacing/format never hides
 * a match). Selection is the same customer id the old select produced.
 */
export function AppointmentCustomerPicker({
  customers,
  value,
  onChange,
  isInvalid,
  describedBy,
}: Readonly<{
  customers: ReadonlyArray<AppointmentCustomer>;
  value: string;
  onChange: (id: string) => void;
  isInvalid?: boolean;
  describedBy?: string;
}>) {
  const t = useTranslations("admin.appointments");
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");

  const filtered = useMemo(() => {
    if (!term) return customers;
    return customers.filter((customer) => {
      const byName = customer.name.toLowerCase().includes(term);
      const byPhone = digits.length > 0 && customer.phone.replace(/\D/g, "").includes(digits);
      return byName || byPhone;
    });
  }, [customers, term, digits]);

  return (
    <div
      aria-describedby={describedBy}
      className={["overflow-hidden rounded-lg border", isInvalid ? "border-admin-danger" : "border-admin-border"].join(" ")}
    >
      <div className="flex items-center gap-2 border-b border-admin-border bg-admin-surface px-3 py-2">
        <MagnifyingGlassIcon className="size-4 shrink-0 text-admin-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("form.customerSearch")}
          aria-label={t("form.customerSearch")}
          className="min-w-0 flex-1 bg-transparent text-sm font-normal text-admin-ink outline-none placeholder:text-admin-muted"
        />
      </div>
      <div role="radiogroup" aria-label={t("form.customer")} className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs font-normal text-admin-muted">{t("form.customerEmpty")}</p>
        ) : (
          filtered.map((customer) => {
            const active = customer.id === value;
            return (
              <button
                key={customer.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(customer.id)}
                className={[
                  "flex w-full items-center justify-between gap-3 border-b border-admin-border px-3 py-2 text-left transition-colors last:border-b-0",
                  active ? "bg-admin-soft" : "bg-admin-surface hover:bg-admin-soft",
                ].join(" ")}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-normal text-admin-ink">{customer.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-admin-muted">{customer.phone || "—"}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
