import { useTranslations } from "next-intl";
import { Button, Chip } from "@heroui/react";
import { AdminColumnFilter, type ColumnFilterOption } from "@/components/blocks/admin/AdminColumnFilter";
import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { formatMoney } from "@/lib/admin-format";
import { ServiceRowActions, ServiceStatusCell, ServiceStatusHeader } from "./ServiceTableCells";
import type { SalonService } from "./data";
import type { ServiceListState } from "./useServiceListState";

/** A push-pin; heroicons has none. Filled when the row is pinned, outlined when it is not. */
function PinIcon({ filled = false, className = "size-4" }: Readonly<{ filled?: boolean; className?: string }>) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
      <path d="M15 3.5 20.5 9l-2.2 1.1-3.6 3.6.4 4.1-1.4 1.4-3.9-3.9-4.6 4.6-.7-.7 4.6-4.6-3.9-3.9L6.6 9.3l4.1.4 3.6-3.6z" />
    </svg>
  );
}

export function ServiceTable({
  services,
  list,
  categoryOptions,
  emptyText,
  busyIds,
  onToggleStatus,
  onTogglePin,
  onEdit,
  onDelete,
}: Readonly<{
  services: ReadonlyArray<SalonService>;
  /** The tab's sort and column filters, which the headers read and change. */
  list: ServiceListState;
  /** The category column's checklist, with each option's row count. */
  categoryOptions: ReadonlyArray<ColumnFilterOption>;
  /** "None yet" for an empty catalogue, "no match" when a filter or search emptied it. */
  emptyText: string;
  /** Services with a status or pin change in flight; their controls stay disabled until it lands. */
  busyIds: ReadonlySet<string>;
  /** Each handler is omitted for an admin who may not write, which leaves its control read-only. */
  onToggleStatus?: (service: SalonService) => void;
  onTogglePin?: (service: SalonService) => void;
  onEdit?: (service: SalonService) => void;
  onDelete?: (service: SalonService) => void;
}>) {
  const t = useTranslations("admin.services");
  const sortProps = { sort: list.sort, onSortChange: list.setSort };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <caption className="sr-only">{t("table.caption")}</caption>
        <thead className="border-b border-admin-border bg-admin-soft/60 text-xs font-semibold text-admin-ink">
          <tr>
            <AdminSortableHeader sortKey="name" className="px-4" {...sortProps}>{t("table.service")}</AdminSortableHeader>
            <AdminSortableHeader
              sortKey="category"
              {...sortProps}
              filter={
                <AdminColumnFilter
                  label={t("filterCategory")}
                  options={categoryOptions}
                  selected={list.filters.categories}
                  onApply={(categories) => list.setFilters({ ...list.filters, categories })}
                  searchable={categoryOptions.length > 6}
                />
              }
            >
              {t("table.category")}
            </AdminSortableHeader>
            <AdminSortableHeader sortKey="price" {...sortProps}>{t("table.price")}</AdminSortableHeader>
            <AdminSortableHeader sortKey="duration" {...sortProps}>{t("table.duration")}</AdminSortableHeader>
            <AdminSortableHeader sortKey="soldCount" {...sortProps}>{t("table.bookingCount90Days")}</AdminSortableHeader>
            <ServiceStatusHeader list={list} />
            <AdminSortableHeader>{t("table.actions")}</AdminSortableHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {services.map((service, index) => {
            const isPinned = Boolean(service.isPinned);
            return (
              <tr key={service.id} className={isPinned ? "bg-admin-soft/40" : undefined}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    {service.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={service.imageUrl}
                        alt=""
                        className="size-11 shrink-0 rounded-lg border border-admin-border object-cover"
                      />
                    ) : (
                      <span aria-hidden="true" className={`size-11 shrink-0 rounded-lg border border-admin-border ${index % 2 ? "bg-gradient-to-br from-rose-100 to-amber-50" : "bg-gradient-to-br from-pink-100 to-fuchsia-50"}`} />
                    )}
                    <span>
                      <strong className="flex items-center gap-1.5">
                        {isPinned ? (
                          <span className="text-admin-accent" title={t("table.pinned")}>
                            <PinIcon filled className="size-3.5" />
                            <span className="sr-only">{t("table.pinned")}</span>
                          </span>
                        ) : null}
                        {service.name}
                      </strong>
                      {service.isFeatured ? (
                        <Chip className="mt-1" size="sm" variant="soft" color="accent">
                          <Chip.Label>{t("table.featured")}</Chip.Label>
                        </Chip>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Chip size="sm" variant="soft" color={service.serviceType === "ADD_ON" ? "default" : service.category ? "accent" : "warning"}>
                    <Chip.Label>{service.serviceType === "ADD_ON" ? t("table.addon") : service.category?.name || t("table.uncategorized")}</Chip.Label>
                  </Chip>
                </td>
                {/* Pinning the short value cells to one line makes the browser take the width out
                    of the service name instead — the only column that reads fine wrapped. */}
                <td className="whitespace-nowrap px-3 py-2 font-semibold">{formatMoney(service.price)}</td>
                <td className="whitespace-nowrap px-3 py-2">{t("table.durationValue", { minutes: service.durationMinutes })}</td>
                <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums">{service.soldCount}</td>
                <ServiceStatusCell service={service} onToggle={onToggleStatus} isBusy={busyIds.has(service.id)} />
                <ServiceRowActions service={service} onEdit={onEdit} onDelete={onDelete}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className={isPinned ? "text-admin-accent" : ""}
                    aria-label={t(isPinned ? "table.unpinService" : "table.pinService", { name: service.name })}
                    aria-pressed={isPinned}
                    isDisabled={!onTogglePin || service.version === undefined || busyIds.has(service.id)}
                    onPress={onTogglePin ? () => onTogglePin(service) : undefined}
                  >
                    <PinIcon filled={isPinned} />
                  </Button>
                </ServiceRowActions>
              </tr>
            );
          })}
        </tbody>
      </table>
      {services.length === 0 ? <p role="status" className="p-12 text-center text-sm text-admin-muted">{emptyText}</p> : null}
    </div>
  );
}
