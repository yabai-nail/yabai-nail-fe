import { useTranslations } from "next-intl";

import { AdminColumnFilter, type ColumnFilterOption } from "@/components/blocks/admin/AdminColumnFilter";
import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { formatMoney } from "@/lib/admin-format";

import { UNGROUPED } from "./addon-groups";
import { ServiceRowActions, ServiceStatusCell, ServiceStatusHeader } from "./ServiceTableCells";
import type { SalonService } from "./data";
import type { ServiceListState } from "./useServiceListState";

/**
 * The add-on catalogue as one table, built like the services table beside it: sortable
 * headers, a group column that filters the way the category column does, and the same
 * show/hide switch. The group is a property of the add-on itself (`addonGroup`) and has no
 * display name of its own yet, so the raw code is what the column shows.
 */
export function AddonTable({
  services,
  list,
  groupOptions,
  emptyText,
  busyIds,
  onToggleStatus,
  onEdit,
  onDelete,
}: Readonly<{
  services: ReadonlyArray<SalonService>;
  /** The tab's sort and column filters, which the headers read and change. */
  list: ServiceListState;
  /** The group column's checklist, with each group's add-on count. */
  groupOptions: ReadonlyArray<ColumnFilterOption>;
  /** "None yet" for an empty catalogue, "no match" when a filter or search emptied it. */
  emptyText: string;
  /** Add-ons with a status change in flight; their switch stays disabled until it lands. */
  busyIds: ReadonlySet<string>;
  /** Each handler is omitted for an admin who may not write, which leaves its control read-only. */
  onToggleStatus?: (service: SalonService) => void;
  onEdit?: (service: SalonService) => void;
  onDelete?: (service: SalonService) => void;
}>) {
  const t = useTranslations("admin.services");
  const sortProps = { sort: list.sort, onSortChange: list.setSort };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">{t("addonsTab.label")}</caption>
        <thead className="border-b border-admin-border bg-admin-soft/60 text-xs font-semibold text-admin-ink">
          <tr>
            <AdminSortableHeader sortKey="name" className="px-4" {...sortProps}>{t("addonsTab.name")}</AdminSortableHeader>
            <AdminSortableHeader
              sortKey="group"
              {...sortProps}
              filter={
                <AdminColumnFilter
                  label={t("addonsTab.filterGroup")}
                  options={groupOptions}
                  selected={list.filters.groups}
                  onApply={(groups) => list.setFilters({ ...list.filters, groups })}
                  searchable={groupOptions.length > 6}
                />
              }
            >
              {t("addonsTab.group")}
            </AdminSortableHeader>
            <AdminSortableHeader sortKey="price" {...sortProps}>{t("table.price")}</AdminSortableHeader>
            <AdminSortableHeader sortKey="duration" {...sortProps}>{t("table.duration")}</AdminSortableHeader>
            <ServiceStatusHeader list={list} />
            <AdminSortableHeader>{t("table.actions")}</AdminSortableHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {services.map((addon) => (
            <tr key={addon.id}>
              <td className="px-4 py-2">
                <div className="flex items-center gap-3">
                  {addon.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={addon.imageUrl}
                      alt=""
                      className="size-11 shrink-0 rounded-lg border border-admin-border object-cover"
                    />
                  ) : (
                    <span aria-hidden="true" className="size-11 shrink-0 rounded-lg border border-admin-border bg-admin-soft" />
                  )}
                  <strong>{addon.name}</strong>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <span className="rounded-md bg-admin-soft px-2 py-1 font-mono text-xs text-admin-ink">{addon.addonGroup ?? UNGROUPED}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-semibold">{formatMoney(addon.price)}</td>
              <td className="whitespace-nowrap px-3 py-2">{t("table.durationValue", { minutes: addon.durationMinutes })}</td>
              <ServiceStatusCell service={addon} onToggle={onToggleStatus} isBusy={busyIds.has(addon.id)} />
              <ServiceRowActions service={addon} onEdit={onEdit} onDelete={onDelete} />
            </tr>
          ))}
        </tbody>
      </table>
      {services.length === 0 ? <p role="status" className="p-12 text-center text-sm text-admin-muted">{emptyText}</p> : null}
    </div>
  );
}
