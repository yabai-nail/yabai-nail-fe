import { useTranslations } from "next-intl";
import { NoSymbolIcon, CheckCircleIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Chip } from "@heroui/react";
import { formatMoney } from "@/lib/admin-format";
import type { StaffMember } from "./data";

type StaffTableProps = {
  readonly staff: ReadonlyArray<StaffMember>;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly canWrite: boolean;
  readonly busyId: string | null;
  readonly onEdit: (member: StaffMember) => void;
  readonly onToggleActive: (member: StaffMember) => void;
};

const MISSING = "—";

function formatOptionalMoney(value: number | null): string {
  return typeof value === "number" ? formatMoney(value) : MISSING;
}

export function StaffTable({ staff, selectedId, onSelect, canWrite, busyId, onEdit, onToggleActive }: StaffTableProps) {
  const t = useTranslations("admin.staff");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <caption className="sr-only">{t("table.caption")}</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3">{t("table.staff")}</th>
            <th scope="col" className="px-3 py-3">{t("orders.status")}</th>
            <th scope="col" className="px-3 py-3">{t("table.branch")}</th>
            <th scope="col" className="px-3 py-3">Doanh thu</th>
            <th scope="col" className="px-3 py-3">{t("compensation.commission")}</th>
            <th scope="col" className="px-3 py-3">{t("detail.payout")}</th>
            <th scope="col" className="px-3 py-3">{t("performance.orders")}</th>
            <th scope="col" className="px-3 py-3 text-right">{t("table.actions")}</th>
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
                <Button variant="ghost" className="h-auto min-h-11 justify-start rounded-lg px-1" onPress={() => onSelect(member.id)}>
                  <Avatar size="sm" color="accent"><Avatar.Fallback>{member.initials}</Avatar.Fallback></Avatar>
                  <strong>{member.name}</strong>
                </Button>
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
