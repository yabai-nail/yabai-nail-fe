import { useTranslations } from "next-intl";
import { NoSymbolIcon, CheckCircleIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Chip } from "@heroui/react";
import { AdminAvatarZoom } from "@/components/blocks/admin/AdminAvatarField";
import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { formatMoney } from "@/lib/admin-format";
import type { AdminTableSort } from "@/lib/admin-table-sort";
import type { StaffMember, StaffSortKey } from "./data";

type StaffTableProps = {
  readonly staff: ReadonlyArray<StaffMember>;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly canWrite: boolean;
  readonly busyId: string | null;
  readonly onEdit: (member: StaffMember) => void;
  readonly onToggleActive: (member: StaffMember) => void;
  /** Owner-only hard delete; omitted for everyone else, which hides the button. */
  readonly onDelete?: (member: StaffMember) => void;
  readonly sort: AdminTableSort<StaffSortKey> | null;
  readonly onSortChange: (next: AdminTableSort<StaffSortKey> | null) => void;
};

const MISSING = "—";

function formatOptionalMoney(value: number | null): string {
  return typeof value === "number" ? formatMoney(value) : MISSING;
}

export function StaffTable({ staff, selectedId, onSelect, canWrite, busyId, onEdit, onToggleActive, onDelete, sort, onSortChange }: StaffTableProps) {
  const t = useTranslations("admin.staff");
  const sortProps = { sort, onSortChange };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <caption className="sr-only">{t("table.caption")}</caption>
        {/* Same header as the services tables: click a title to sort, carets show the direction. */}
        <thead className="border-b border-admin-border bg-admin-soft/60 text-xs font-semibold text-admin-ink">
          <tr>
            <AdminSortableHeader sortKey="name" className="px-4" {...sortProps}>{t("table.staff")}</AdminSortableHeader>
            <AdminSortableHeader>{t("orders.status")}</AdminSortableHeader>
            <AdminSortableHeader>{t("table.branch")}</AdminSortableHeader>
            <AdminSortableHeader sortKey="revenue" {...sortProps}>{t("table.revenue")}</AdminSortableHeader>
            <AdminSortableHeader sortKey="commissionRate" {...sortProps}>{t("compensation.commission")}</AdminSortableHeader>
            <AdminSortableHeader sortKey="commissionAmount" {...sortProps}>{t("detail.payout")}</AdminSortableHeader>
            <AdminSortableHeader sortKey="orders" {...sortProps}>{t("performance.orders")}</AdminSortableHeader>
            <th scope="col" className="whitespace-nowrap px-3 py-2 text-right">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {staff.map((member) => (
            <tr
              key={member.id}
              className={`cursor-pointer transition-colors hover:bg-admin-soft/60 ${
                selectedId === member.id ? "bg-admin-soft" : ""
              }`}
              onClick={() => onSelect(member.id)}
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <AdminAvatarZoom src={member.avatarUrl} name={member.name} size="sm" />
                  <Button variant="ghost" className="h-auto min-h-11 justify-start rounded-lg px-1" onPress={() => onSelect(member.id)}>
                    <span className="flex flex-col items-start leading-tight">
                      <strong>{member.name}</strong>
                      {member.phone ? <span className="text-xs font-normal tabular-nums text-admin-muted">{member.phone}</span> : null}
                    </span>
                  </Button>
                </div>
              </td>
              <td className="px-3 py-2">
                <Chip size="sm" variant="soft" color={member.status === "working" ? "success" : "default"}>
                  <Chip.Label>{member.status === "working" ? t("tabs.working") : t("tabs.off")}</Chip.Label>
                </Chip>
              </td>
              <td className="px-3 py-2 text-admin-muted">{member.branchName ?? MISSING}</td>
              <td className="px-3 py-2 font-medium">{formatOptionalMoney(member.revenue)}</td>
              <td className="px-3 py-2">
                {typeof member.commissionRate === "number" ? `${member.commissionRate}%` : MISSING}
              </td>
              <td className="px-3 py-2 font-bold text-admin-accent">{formatOptionalMoney(member.commissionAmount)}</td>
              <td className="px-3 py-2">{member.orders ?? MISSING}</td>
              <td className="px-3 py-2">
                {canWrite ? (
                  // Stop the row's select handler from firing when a button here is pressed.
                  <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => onEdit(member)}>
                      <PencilSquareIcon className="size-4" />{t("editAction")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`rounded-lg ${member.status === "working" ? "text-admin-danger" : "text-admin-success"}`}
                      isDisabled={busyId === member.id}
                      onPress={() => onToggleActive(member)}
                    >
                      {member.status === "working" ? <NoSymbolIcon className="size-4" /> : <CheckCircleIcon className="size-4" />}
                      {member.status === "working" ? t("actionDeactivate") : t("actionActivate")}
                    </Button>
                    {onDelete ? (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="rounded-lg text-admin-danger"
                        aria-label={t("delete.ariaLabel", { name: member.name })}
                        isDisabled={busyId === member.id}
                        onPress={() => onDelete(member)}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <span className="block text-right text-admin-muted">{MISSING}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
