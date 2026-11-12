"use client";

import { useTranslations } from "next-intl";
import { ChartBarIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Chip } from "@heroui/react";
import { ServiceInfoCard, ServiceInfoEmpty } from "./ServiceInfoCard";
import { SurchargePanel } from "./SurchargePanel";
import { getPopularServices, type SalonService } from "./data";

// The summary cards on their own row above the service list, so the table below gets the full
// width: best sellers, surcharges and the visibility note. All three share ServiceInfoCard and
// stretch to the row's height, so they read as one set.
export function ServiceSummaryCards({ services }: Readonly<{ services: ReadonlyArray<SalonService> }>) {
  const t = useTranslations("admin.services");
  const topServices = getPopularServices(services).slice(0, 5);
  const visibleCount = services.filter((service) => service.isVisible).length;

  return (
    <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ServiceInfoCard icon={ChartBarIcon} title={t("sidebar.topServices")} subtitle={t("sidebar.popularityPeriod")}>
        {topServices.length === 0 ? (
          <ServiceInfoEmpty icon={ChartBarIcon}>{t("sidebar.popularityEmpty")}</ServiceInfoEmpty>
        ) : (
          <ol className="space-y-2.5">
            {topServices.map((service, index) => (
              <li key={service.id} className="flex items-center gap-3 text-sm">
                <span className="w-4 shrink-0 text-center text-xs font-bold tabular-nums text-admin-accent">{index + 1}</span>
                {service.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={service.imageUrl} alt="" className="size-9 shrink-0 rounded-lg border border-admin-border object-cover" />
                ) : (
                  <span aria-hidden="true" className="size-9 shrink-0 rounded-lg bg-gradient-to-br from-pink-100 to-amber-50" />
                )}
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs text-admin-ink">{service.name}</strong>
                  {service.isFeatured ? (
                    <Chip className="mt-0.5" size="sm" variant="soft" color="accent">
                      <Chip.Label>{t("table.featured")}</Chip.Label>
                    </Chip>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-admin-accent">
                  {t("sidebar.bookingCount", { count: service.soldCount })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </ServiceInfoCard>
      <SurchargePanel />
      <ServiceInfoCard icon={EyeIcon} title={t("sidebar.noteHeading")} subtitle={t("sidebar.noteSubtitle")}>
        {/* The counts make the note useful at a glance; the switch in the table changes them. */}
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-admin-soft px-3 py-2">
            <dt className="text-xs text-admin-muted">{t("table.visible")}</dt>
            <dd className="text-lg font-bold tabular-nums text-admin-ink">{visibleCount}</dd>
          </div>
          <div className="rounded-lg bg-admin-soft px-3 py-2">
            <dt className="text-xs text-admin-muted">{t("table.hidden")}</dt>
            <dd className="text-lg font-bold tabular-nums text-admin-ink">{services.length - visibleCount}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-admin-muted">{t("sidebar.noteBody")}</p>
      </ServiceInfoCard>
    </div>
  );
}
