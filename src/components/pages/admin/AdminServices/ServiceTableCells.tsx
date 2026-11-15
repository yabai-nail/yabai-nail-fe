import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AdminColumnFilter } from "@/components/blocks/admin/AdminColumnFilter";
import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { AdminStatusSwitch } from "@/components/blocks/admin/AdminStatusSwitch";

import type { SalonService } from "./data";
import type { ServiceListState } from "./useServiceListState";

// The cells the services table and the add-ons table have in common, so the two tabs cannot
// drift apart in how a status is filtered, switched, or a row edited and deleted.

type RowHandler = (service: SalonService) => void;

/** Under a price: the tier it follows, so a linked price reads as shared rather than typed. */
export function ServiceTierNote({ service, tierNames }: Readonly<{ service: SalonService; tierNames: ReadonlyMap<string, string> }>) {
  const t = useTranslations("admin.services");
  const name = service.priceTierId ? tierNames.get(service.priceTierId) : undefined;
  return name ? <span className="block text-xs font-normal text-admin-muted">{t("price.tableTier", { name })}</span> : null;
}

/** The Status column header: sortable, with the visible/hidden checklist. */
export function ServiceStatusHeader({ list }: Readonly<{ list: ServiceListState }>) {
  const t = useTranslations("admin.services");
  return (
    <AdminSortableHeader
      sortKey="status"
      sort={list.sort}
      onSortChange={list.setSort}
      filter={
        <AdminColumnFilter
          label={t("filterStatus")}
          options={[
            { value: "visible", label: t("table.visible") },
            { value: "hidden", label: t("table.hidden") },
          ]}
          selected={list.filters.statuses}
          onApply={(statuses) => list.setFilters({ ...list.filters, statuses })}
        />
      }
    >
      {t("table.status")}
    </AdminSortableHeader>
  );
}

/** The show/hide switch. Read-only without `onToggle`, or for a fixture row with no version. */
export function ServiceStatusCell({
  service,
  onToggle,
  isBusy,
}: Readonly<{ service: SalonService; onToggle?: RowHandler; isBusy: boolean }>) {
  const t = useTranslations("admin.services");
  return (
    <td className="whitespace-nowrap px-3 py-2">
      <AdminStatusSwitch
        isOn={service.isVisible}
        onToggle={onToggle && service.version !== undefined ? () => onToggle(service) : undefined}
        isBusy={isBusy}
        label={t("table.toggleStatus", { name: service.name })}
        onText={t("table.switchOn")}
        offText={t("table.switchOff")}
      />
    </td>
  );
}

/** Edit and delete, after any extra action a table passes as children (the services pin). */
export function ServiceRowActions({
  service,
  onEdit,
  onDelete,
  children,
}: Readonly<{ service: SalonService; onEdit?: RowHandler; onDelete?: RowHandler; children?: ReactNode }>) {
  const t = useTranslations("admin.services");
  const unsaved = service.version === undefined;
  return (
    <td className="whitespace-nowrap px-3 py-2">
      <div className="flex gap-1">
        {children}
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={t("table.editService", { name: service.name })}
          isDisabled={!onEdit || unsaved}
          onPress={onEdit ? () => onEdit(service) : undefined}
        >
          <PencilSquareIcon className="size-4" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="text-admin-danger"
          aria-label={t("table.deleteService", { name: service.name })}
          isDisabled={!onDelete || unsaved}
          onPress={onDelete ? () => onDelete(service) : undefined}
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </td>
  );
}
