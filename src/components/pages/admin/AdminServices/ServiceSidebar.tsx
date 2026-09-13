"use client";

import { useTranslations } from "next-intl";
import { Card, Chip } from "@heroui/react";
import { SurchargePanel } from "./SurchargePanel";
import { getPopularServices, type SalonService } from "./data";

// Categories used to be managed from this 17rem column, where their names truncated to an
// ellipsis and there was no room for the branch scope or the on/off switch. They moved to the
// "Danh mục" view, so this column keeps only what belongs beside the service list.
export function ServiceSidebar({ services }: Readonly<{ services: ReadonlyArray<SalonService> }>) {
  const t = useTranslations("admin.services");
  const topServices = getPopularServices(services).slice(0, 5);

  return (
    <div className="space-y-4">
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="block px-4 pt-4">
          <h2 className="font-bold">{t("sidebar.topServices")}</h2>
          <p className="mt-1 text-xs text-admin-muted">{t("sidebar.popularityPeriod")}</p>
        </Card.Header>
        <Card.Content className="p-4">
          {topServices.length === 0 ? (
            <p className="text-xs text-admin-muted">{t("sidebar.popularityEmpty")}</p>
          ) : (
            <ol className="space-y-3">
              {topServices.map((service, index) => (
                <li key={service.id} className="grid grid-cols-[1.5rem_2.5rem_1fr] items-center gap-2 text-sm">
                  <span className="font-bold text-admin-accent">{index + 1}</span>
                  {service.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={service.imageUrl} alt="" className="size-10 rounded-lg border border-admin-border object-cover" />
                  ) : (
                    <span aria-hidden="true" className="size-10 rounded-lg bg-gradient-to-br from-pink-100 to-amber-50" />
                  )}
                  <span>
                    <strong className="block text-xs">{service.name}</strong>
                    <span className="text-xs text-admin-accent">{t("sidebar.bookingCount", { count: service.soldCount })}</span>
                    {service.isFeatured ? (
                      <Chip className="mt-1" size="sm" variant="soft" color="accent">
                        <Chip.Label>{t("table.featured")}</Chip.Label>
                      </Chip>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card.Content>
      </Card>
      <SurchargePanel />
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="p-4"><h2 className="font-bold">{t("sidebar.noteHeading")}</h2><p className="mt-2 text-xs leading-5 text-admin-muted">{t("sidebar.noteBody")}</p></Card.Content>
      </Card>
    </div>
  );
}
