import { useTranslations } from "next-intl";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Chip } from "@heroui/react";
import { formatNumber, formatMoney } from "@/lib/admin-format";
import type { Customer, CustomerRank } from "./data";

const rankLabel: Record<CustomerRank, string> = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  none: "—",
};

export function CustomerTable({ customers, selectedId, onSelect, onEdit }: Readonly<{
  customers: ReadonlyArray<Customer>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Absent until a branch is chosen, since editing needs one. */
  onEdit?: (id: string) => void;
}>) {
  const t = useTranslations("admin.customers");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">{t("table.caption")}</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">{t("table.customer")}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t("table.phone")}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t("table.lastVisit")}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t("table.totalSpend")}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t("table.points")}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t("table.rank")}</th>
            <th scope="col" className="px-3 py-3"><span className="sr-only">{t("table.actions")}</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {customers.map((customer) => (
            <tr key={customer.id} className={selectedId === customer.id ? "bg-admin-soft" : "bg-admin-surface"}>
              <td className="px-3 py-2">
                <Button variant="ghost" className="h-auto min-h-11 w-full justify-start rounded-lg px-1" onPress={() => onSelect(customer.id)}>
                  <Avatar size="sm" color="accent"><Avatar.Fallback>{customer.initials}</Avatar.Fallback></Avatar>
                  <span className="text-left">
                    <span className="block font-semibold text-admin-ink">{customer.name}</span>
                    <span className="mt-0.5 block text-xs text-admin-accent">{customer.segment === "loyal" ? t("segment.loyal") : customer.segment === "new" ? t("segment.new") : t("segment.longTerm")}</span>
                  </span>
                </Button>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{customer.phone}</td>
              <td className="px-3 py-2 whitespace-nowrap">{customer.lastVisit}</td>
              <td className="px-3 py-2 whitespace-nowrap font-medium">{formatMoney(customer.totalSpend)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatNumber(customer.points)} pt</td>
              <td className="px-3 py-2"><Chip size="sm" variant="soft" color={customer.rank === "gold" ? "warning" : "default"}><Chip.Label>{rankLabel[customer.rank]}</Chip.Label></Chip></td>
              <td className="px-3 py-2">
                {/* Was a "..." with no handler and no prop to call. It is a single
                    action, so it says so rather than promising a menu. */}
                {onEdit ? (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("table.edit", { name: customer.name })}
                    onPress={() => onEdit(customer.id)}
                  >
                    <PencilSquareIcon className="size-4" />
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 ? <p role="status" className="px-4 py-12 text-center text-sm text-admin-muted">{t("table.empty")}</p> : null}
    </div>
  );
}
