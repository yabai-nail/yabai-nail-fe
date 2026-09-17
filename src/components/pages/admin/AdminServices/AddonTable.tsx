import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Chip } from "@heroui/react";

import { formatMoney } from "@/lib/admin-format";

import { groupAddonCatalog } from "./addon-groups";
import type { SalonService } from "./data";

/**
 * The add-on catalogue, grouped the way a customer meets it.
 *
 * The group is a property of the add-on itself (`addonGroup`), so this is the only screen on
 * which a salon sees its groups as groups. It shows the raw code because there is nowhere to
 * store a display name for one yet — the backend keys the group by that code alone.
 */
export function AddonTable({
  services,
  onEdit,
  onDelete,
}: Readonly<{
  services: ReadonlyArray<SalonService>;
  onEdit?: (service: SalonService) => void;
  onDelete?: (service: SalonService) => void;
}>) {
  const t = useTranslations("admin.services");
  const grouped = useMemo(() => groupAddonCatalog(services), [services]);

  if (services.length === 0) {
    return <p role="status" className="p-12 text-center text-sm text-admin-muted">{t("addonsTab.empty")}</p>;
  }

  return (
    <div className="grid gap-5">
      {grouped.map(([code, addons]) => (
        <section key={code} className="grid gap-2">
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold text-admin-ink">
            <span className="rounded-md bg-admin-soft px-2 py-1 font-mono text-xs">{code}</span>
            <span className="font-normal text-xs text-admin-muted">{t("addonsTab.groupCount", { count: addons.length })}</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">{t("addonsTab.caption", { group: code })}</caption>
              <thead className="border-b border-admin-border text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">{t("addonsTab.name")}</th>
                  <th scope="col" className="px-3 py-3">{t("table.price")}</th>
                  <th scope="col" className="px-3 py-3">{t("table.duration")}</th>
                  <th scope="col" className="px-3 py-3">{t("table.status")}</th>
                  <th scope="col" className="px-3 py-3">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {addons.map((addon) => (
                  <tr key={addon.id}>
                    <td className="px-4 py-2"><strong>{addon.name}</strong></td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold">{formatMoney(addon.price)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{t("table.durationValue", { minutes: addon.durationMinutes })}</td>
                    {/* Same one-line rule as ServiceTable: this table is narrower today, but the
                        status chip is the same width and breaks the same way once a group holds a
                        long add-on name. */}
                    <td className="whitespace-nowrap px-3 py-2">
                      <Chip size="sm" variant="soft" color={addon.isVisible ? "success" : "default"}>
                        <Chip.Label>{addon.isVisible ? t("table.visible") : t("table.hidden")}</Chip.Label>
                      </Chip>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="flex gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          aria-label={t("table.editService", { name: addon.name })}
                          isDisabled={!onEdit || addon.version === undefined}
                          onPress={onEdit ? () => onEdit(addon) : undefined}
                        >
                          <PencilSquareIcon className="size-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          className="text-admin-danger"
                          aria-label={t("table.deleteService", { name: addon.name })}
                          isDisabled={!onDelete || addon.version === undefined}
                          onPress={onDelete ? () => onDelete(addon) : undefined}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
