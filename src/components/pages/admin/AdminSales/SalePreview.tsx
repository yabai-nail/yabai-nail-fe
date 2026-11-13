"use client";

import { ArrowRightIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { formatMoney } from "@/lib/admin-format";
import { parseSaleRule, saleCoverage, saleFormScopes, salePreview, type SaleForm, type SaleTarget } from "./data";

/**
 * What the sale would do, before it is saved: up to six items with original → sale price, how
 * many items it reaches, and a warning (not a block) when a flat price would not lower some.
 */
export function SalePreview({
  form,
  designTargets,
  serviceTargets,
}: Readonly<{ form: SaleForm; designTargets: ReadonlyArray<SaleTarget>; serviceTargets: ReadonlyArray<SaleTarget> }>) {
  const t = useTranslations("admin.sales.preview");
  const covered = saleCoverage(saleFormScopes(form), designTargets, serviceTargets);
  const targets = [...covered.designs, ...covered.services];
  const unpriced = covered.designs.filter((design) => design.price === null).length;
  const rule = parseSaleRule(form);
  const preview = rule ? salePreview(targets, rule) : null;

  return (
    <aside aria-labelledby="sale-preview-title" className="grid content-start gap-3 rounded-lg border border-admin-border bg-admin-soft/60 p-4 lg:sticky lg:top-0 lg:self-start">
      <h3 id="sale-preview-title" className="text-sm font-semibold text-admin-ink">{t("title")}</h3>
      {targets.length === 0 ? (
        <p className="text-xs leading-5 text-admin-muted">{t("empty")}</p>
      ) : !preview ? (
        <p className="text-xs leading-5 text-admin-muted">{t("needRule")}</p>
      ) : (
        <>
          <p aria-live="polite" className="text-xs font-semibold text-admin-ink">{t("total", { count: preview.total })}</p>
          <ul className="grid gap-2">
            {preview.rows.map(({ target, original, price, applies }) => (
              <li key={target.id} className="grid gap-0.5 text-xs">
                <span className="truncate font-medium text-admin-ink">{target.name}</span>
                {applies ? (
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-admin-muted line-through">{formatMoney(original)}</span>
                    <ArrowRightIcon aria-hidden className="size-3 text-admin-muted" />
                    <span className="font-semibold text-admin-ink">{formatMoney(price)}</span>
                  </span>
                ) : (
                  <span className="tabular-nums text-admin-muted">{formatMoney(original)} · {t("keepsPrice")}</span>
                )}
              </li>
            ))}
          </ul>
          {preview.total > preview.rows.length ? (
            <p className="text-xs text-admin-muted">{t("more", { count: preview.total - preview.rows.length })}</p>
          ) : null}
          {rule?.type === "FIXED" && preview.notCheaper > 0 ? (
            <p role="status" className="flex gap-2 rounded-lg border border-admin-warning/40 bg-admin-surface px-3 py-2 text-xs leading-5 text-admin-ink">
              <ExclamationTriangleIcon aria-hidden className="size-4 shrink-0 text-admin-warning" />
              {t("notCheaper", { count: preview.notCheaper })}
            </p>
          ) : null}
        </>
      )}
      {unpriced > 0 ? <p className="text-xs leading-5 text-admin-muted">{t("unpriced", { count: unpriced })}</p> : null}
    </aside>
  );
}
