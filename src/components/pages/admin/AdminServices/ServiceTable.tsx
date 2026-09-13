import { useTranslations } from "next-intl";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Chip } from "@heroui/react";
import { formatMoney } from "@/lib/admin-format";
import type { SalonService } from "./data";

export function ServiceTable({
  services,
  onEdit,
  onDelete,
}: Readonly<{
  services: ReadonlyArray<SalonService>;
  /** Optional edit callback. When omitted the pencil button is hidden. */
  onEdit?: (service: SalonService) => void;
  /** Optional delete callback. When omitted the destructive action is hidden. */
  onDelete?: (service: SalonService) => void;
}>) {
  const t = useTranslations("admin.services");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <caption className="sr-only">{t("table.caption")}</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3">{t("table.service")}</th>
            <th scope="col" className="px-3 py-3">{t("table.category")}</th>
            <th scope="col" className="px-3 py-3">{t("table.price")}</th>
            <th scope="col" className="px-3 py-3">{t("table.duration")}</th>
            <th scope="col" className="px-3 py-3">{t("table.bookingCount90Days")}</th>
            <th scope="col" className="px-3 py-3">{t("table.status")}</th>
            <th scope="col" className="px-3 py-3">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {services.map((service, index) => (
            <tr key={service.id}>
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
                    <strong className="block">{service.name}</strong>
                    {service.isFeatured ? (
                      <Chip className="mt-1" size="sm" variant="soft" color="accent">
                        <Chip.Label>{t("table.featured")}</Chip.Label>
                      </Chip>
                    ) : null}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2">
                <Chip size="sm" variant="soft" color={service.category ? "accent" : "warning"}>
                  <Chip.Label>{service.category?.name || t("table.uncategorized")}</Chip.Label>
                </Chip>
              </td>
              <td className="px-3 py-2 font-semibold">{formatMoney(service.price)}</td>
              <td className="px-3 py-2">{t("table.durationValue", { minutes: service.durationMinutes })}</td>
              <td className="px-3 py-2 font-semibold tabular-nums">{service.soldCount}</td>
              <td className="px-3 py-2">
                <Chip size="sm" variant="soft" color={service.isVisible ? "success" : "default"}>
                  <Chip.Label>{service.isVisible ? t("table.visible") : t("table.hidden")}</Chip.Label>
                </Chip>
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("table.editService", { name: service.name })}
                    isDisabled={!onEdit || service.version === undefined}
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
                    isDisabled={!onDelete || service.version === undefined}
                    onPress={onDelete ? () => onDelete(service) : undefined}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {services.length === 0 ? <p role="status" className="p-12 text-center text-sm text-admin-muted">{t("table.empty")}</p> : null}
    </div>
  );
}
