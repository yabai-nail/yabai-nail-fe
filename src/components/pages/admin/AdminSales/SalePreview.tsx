"use client";

import { ArrowRightIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminNailDesignThumbnail } from "@/components/pages/admin/AdminNailDesigns/AdminNailDesignThumbnail";

import { formatMoney } from "@/lib/admin-format";
import { SaleOptionsNotice } from "./SaleScopeFields";
import {
  parseSaleRule,
  saleCoverage,
  saleFormScopes,
  salePreview,
  type SaleForm,
  type SaleOptionsStatus,
  type SaleTarget,
} from "./data";

/**
 * What the sale would do, before it is saved: paginated items with photos and original → sale price, how
 * many items it reaches, and warnings (not blocks) when a flat price would not lower some or a
 * price cuts some to half or less.
 */
export function SalePreview({
  form,
  designTargets,
  serviceTargets,
  status,
}: Readonly<{
  form: SaleForm;
  designTargets: ReadonlyArray<SaleTarget>;
  serviceTargets: ReadonlyArray<SaleTarget>;
  /** The designs and services lists together; the preview waits for both. */
  status: SaleOptionsStatus;
}>) {
  const t = useTranslations("admin.sales.preview");
  const tForm = useTranslations("admin.sales.form");
  const [pagination, setPagination] = useState({ key: "", page: 1 });
  const [selectedKind, setSelectedKind] = useState<"designs" | "services">("designs");
  const tabsId = useId();
  const covered = saleCoverage(saleFormScopes(form), designTargets, serviceTargets);
  const kinds = (["designs", "services"] as const).filter((kind) => form[kind].mode !== "NONE");
  const activeKind = kinds.includes(selectedKind) ? selectedKind : kinds[0];
  const showTabs = kinds.length === 2;
  const targets = [
    ...covered.designs.map((target) => ({ ...target, kind: "designs" as const })),
    ...covered.services.map((target) => ({ ...target, kind: "services" as const })),
  ];
  const visibleTargets = targets.filter((target) => target.kind === activeKind);
  const unpriced = activeKind === "designs" ? covered.designs.filter((design) => design.price === null).length : 0;
  const rule = parseSaleRule(form);
  const preview = rule ? salePreview(visibleTargets, rule, visibleTargets.length) : null;
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil((preview?.total ?? 0) / pageSize));
  const selectionKey = JSON.stringify([activeKind, visibleTargets.map(({ id }) => id)]);
  const page = pagination.key === selectionKey ? Math.min(pagination.page, pageCount) : 1;
  const rows = preview?.rows.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <aside aria-labelledby="sale-preview-title" className="grid content-start gap-3 rounded-lg border border-admin-border bg-admin-soft/60 p-4 lg:sticky lg:top-0 lg:self-start">
      <h3 id="sale-preview-title" className="text-sm font-semibold text-admin-ink">{t("title")}</h3>
      <p className="text-xs leading-5 text-admin-muted">{t("ruleOnly")}</p>
      {showTabs ? (
        <div role="tablist" aria-label={t("title")} className="grid grid-cols-2 gap-1 rounded-lg border border-admin-border bg-admin-surface p-1">
          {kinds.map((kind, index) => (
            <button
              key={kind}
              type="button"
              role="tab"
              id={`${tabsId}-${kind}`}
              aria-controls={`${tabsId}-panel`}
              aria-selected={activeKind === kind}
              tabIndex={activeKind === kind ? 0 : -1}
              onClick={() => { setSelectedKind(kind); setPagination({ key: "", page: 1 }); }}
              onKeyDown={(event) => {
                const next = event.key === "Home" ? 0 : event.key === "End" ? kinds.length - 1 : event.key === "ArrowRight" ? (index + 1) % kinds.length : event.key === "ArrowLeft" ? (index + kinds.length - 1) % kinds.length : null;
                if (next === null) return;
                event.preventDefault();
                setSelectedKind(kinds[next]);
                setPagination({ key: "", page: 1 });
                document.getElementById(`${tabsId}-${kinds[next]}`)?.focus();
              }}
              className={`min-h-11 min-w-0 rounded-md px-2 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${activeKind === kind ? "bg-admin-accent text-admin-on-accent" : "text-admin-muted hover:bg-admin-soft hover:text-admin-ink"}`}
            >
              {tForm(kind)}{status === "ready" ? <span className="ml-2 tabular-nums">({covered[kind].length})</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div id={`${tabsId}-panel`} role={showTabs ? "tabpanel" : undefined} aria-labelledby={showTabs ? `${tabsId}-${activeKind}` : undefined} tabIndex={showTabs ? 0 : undefined} className="grid min-w-0 gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent">
      {status !== "ready" ? (
        <SaleOptionsNotice status={status} />
      ) : visibleTargets.length === 0 ? (
        <p className="text-xs leading-5 text-admin-muted">{t("empty")}</p>
      ) : !preview ? (
        <p className="text-xs leading-5 text-admin-muted">{t("needRule")}</p>
      ) : (
        <>
          <p aria-live="polite" className="text-xs font-semibold text-admin-ink">{t("total", { count: preview.total })}</p>
          <ul className="grid gap-2">
            {rows.map(({ target, original, price, applies }) => (
              <li key={target.kind + ":" + target.id} className="flex items-start gap-3 rounded-lg border border-admin-border bg-admin-surface p-3 text-sm">
                <AdminNailDesignThumbnail imageUrl={target.imageUrl} alt="" />
                <div className="grid min-w-0 flex-1 gap-1">
                  <span className="break-words font-semibold text-admin-ink">{target.name}</span>
                  <span className="text-xs text-admin-muted">{tForm(target.kind)}</span>
                  {applies ? (
                    <span className="flex flex-wrap items-center gap-1.5 tabular-nums">
                      <span className="text-admin-muted line-through">{formatMoney(original)}</span>
                      <ArrowRightIcon aria-hidden className="size-3 text-admin-muted" />
                      <span className="font-semibold text-admin-ink">{formatMoney(price)}</span>
                    </span>
                  ) : (
                    <span className="tabular-nums text-admin-muted">{formatMoney(original)} · {t("keepsPrice")}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto">
            <AdminPagination
              page={page}
              pageCount={pageCount}
              label={t("title")}
              onPageChange={(nextPage) => setPagination({ key: selectionKey, page: nextPage })}
            />
          </div>
          {rule?.type === "FIXED" && preview.notCheaper > 0 ? (
            <p role="status" className="flex gap-2 rounded-lg border border-admin-warning/40 bg-admin-surface px-3 py-2 text-xs leading-5 text-admin-ink">
              <ExclamationTriangleIcon aria-hidden className="size-4 shrink-0 text-admin-warning" />
              {t("notCheaper", { count: preview.notCheaper })}
            </p>
          ) : null}
          {preview.deep > 0 ? (
            <p role="status" className="flex gap-2 rounded-lg border border-admin-warning/40 bg-admin-surface px-3 py-2 text-xs leading-5 text-admin-ink">
              <ExclamationTriangleIcon aria-hidden className="size-4 shrink-0 text-admin-warning" />
              {t("deep", { count: preview.deep })}
            </p>
          ) : null}
        </>
      )}
      {status === "ready" && unpriced > 0 ? <p className="text-xs leading-5 text-admin-muted">{t("unpriced", { count: unpriced })}</p> : null}
      </div>
    </aside>
  );
}
