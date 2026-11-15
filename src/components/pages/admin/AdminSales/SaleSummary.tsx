"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import { describeSaleRule, parseSaleRule, saleCoverage, saleFormScopes, saleLoweredCounts, type SaleForm, type SaleOptionsStatus, type SaleTarget } from "./data";

/** A compact review next to Save, visible even when the preview is below a long form. */
export function SaleSummary({ form, designs, services, status }: Readonly<{
  form: SaleForm;
  designs: ReadonlyArray<SaleTarget>;
  services: ReadonlyArray<SaleTarget>;
  status: SaleOptionsStatus;
}>) {
  const t = useTranslations("admin.sales");
  const locale = useLocale();
  const scopes = saleFormScopes(form);
  const covered = saleCoverage(scopes, designs, services);
  const rule = parseSaleRule(form);
  const lowered = rule ? saleLoweredCounts({ ...scopes, rule }, designs, services) : null;
  const startsAt = new Date(form.startsAt);
  const endsAt = new Date(form.endsAt);
  const formatter = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Tokyo", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const priceText = rule
    ? describeSaleRule(rule, formatMoney, (key, values) => t(`rule.${key}`, values))
    : t("preview.needRule");

  let scopeText = t("summary.unavailable");
  if (status === "ready") {
    scopeText = covered.designs.length + covered.services.length === 0
      ? t("preview.empty")
      : t("summary.scope", { designs: covered.designs.length, services: covered.services.length });
    if (lowered) scopeText += ` · ${t("summary.lowered", { count: lowered.designs + lowered.services })}`;
  }

  return (
    <div className="min-w-0 space-y-1 text-xs leading-5" aria-live="polite" aria-atomic="true">
      <p className="font-semibold text-admin-ink">{t("summary.title")}</p>
      <p className="text-admin-ink">{priceText}</p>
      <p className="text-admin-muted">{scopeText}</p>
      {endsAt > startsAt ? <p className="text-admin-muted">{formatter.formatRange(startsAt, endsAt)} · {t("summary.timezone")}</p> : null}
    </div>
  );
}
