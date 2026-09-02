import { useTranslations } from "next-intl";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Chip } from "@heroui/react";
import { formatMoney } from "@/lib/admin-format";
import type { StaffMember } from "./data";

type StaffTableProps = {
  readonly staff: ReadonlyArray<StaffMember>;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** Absent until a branch is chosen, since editing needs one. */
  readonly onEdit?: (id: string) => void;
};

const MISSING = "—";

function formatOptionalMoney(value: number | null): string {
  return typeof value === "number" ? formatMoney(value) : MISSING;
}

export function StaffTable({ staff, selectedId, onSelect, onEdit }: StaffTableProps) {
  const t = useTranslations("admin.staff");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <caption className="sr-only">{t("table.caption")}</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3">{t("table.staff")}</th>
            <th scope="col" className="px-3 py-3">{t("table.status")}</th>
            <th scope="col" className="px-3 py-3">Doanh thu</th>
            <th scope="col" className="px-3 py-3">{t("table.commission")}</th>
            <th scope="col" className="px-3 py-3">{t("table.payout")}</th>
            <th scope="col" className="px-3 py-3">{t("table.orders")}</th>
            <th scope="col"><span className="sr-only">{t("table.actions")}</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {staff.map((member) => (
            <tr key={member.id} className={selectedId === member.id ? "bg-admin-soft" : ""}>
              <td className="px-3 py-2">
                <Button variant="ghost" className="h-auto min-h-11 justify-start rounded-lg px-1" onPress={() => onSelect(member.id)}>
                  <Avatar size="sm" color="accent"><Avatar.Fallback>{member.initials}</Avatar.Fallback></Avatar>
                  <strong>{member.name}</strong>
                </Button>
              </td>
              <td className="px-3 py-2">
                <Chip size="sm" variant="soft" color={member.status === "working" ? "success" : "default"}>
                  <Chip.Label>{member.status === "working" ? t("statusWorking") : t("statusOff")}</Chip.Label>
                </Chip>
              </td>
              <td className="px-3 py-2 font-medium">{formatOptionalMoney(member.revenue)}</td>
              <td className="px-3 py-2">
                {typeof member.commissionRate === "number" ? `${member.commissionRate}%` : MISSING}
              </td>
              <td className="px-3 py-2 font-bold text-admin-accent">{formatOptionalMoney(member.commissionAmount)}</td>
              <td className="px-3 py-2">{member.orders ?? MISSING}</td>
              <td className="px-3 py-2">
                {/* Was a "..." with no handler and no prop to call. One action, so it
                    names that action instead of promising a menu. */}
                {onEdit ? (
                  <Button isIconOnly size="sm" variant="ghost" aria-label={t("table.edit", { name: member.name })} onPress={() => onEdit(member.id)}>
                    <PencilSquareIcon className="size-4" />
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
