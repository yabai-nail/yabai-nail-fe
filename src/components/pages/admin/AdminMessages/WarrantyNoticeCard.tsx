import { ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import type { WarrantyNotice } from "./data";

function displayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[1]}/${match[2]}/${match[3]}` : value;
}

export function WarrantyNoticeCard({ warranty }: Readonly<{ warranty: WarrantyNotice }>) {
  const t = useTranslations("admin.messages.warranty");

  return (
    <article aria-label={t("accessibilityLabel", { service: warranty.serviceName })} className="w-full max-w-2xl overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <header className="flex items-center gap-2 border-b border-admin-border bg-admin-soft px-4 py-3">
        <ShieldCheckIcon aria-hidden className="size-5 text-admin-accent" />
        <div>
          <h3 className="text-sm font-bold text-admin-ink">{t("heading")}</h3>
          <p className="text-xs text-admin-muted">{t("intro")}</p>
        </div>
      </header>
      <div className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-xs text-admin-muted">{t("service")}</p>
          <p className="font-semibold text-admin-ink">{warranty.serviceName}</p>
        </div>
        <div>
          <p className="text-xs text-admin-muted">{t("duration")}</p>
          <p className="font-semibold text-admin-ink">{t("days", { count: warranty.warrantyDays })}</p>
        </div>
        <div>
          <p className="text-xs text-admin-muted">{t("period")}</p>
          <p className="font-semibold text-admin-ink">{displayDate(warranty.startsOn)} – {displayDate(warranty.endsOn)}</p>
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-admin-soft p-3 text-xs leading-relaxed text-admin-ink sm:col-span-2">
          <SparklesIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-admin-accent" />
          {t("marketing")}
        </p>
      </div>
    </article>
  );
}
