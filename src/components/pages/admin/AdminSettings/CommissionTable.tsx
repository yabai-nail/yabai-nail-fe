import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/admin-format";
import type { CommissionPolicy } from "./data";
import { useTranslations } from "next-intl";

const MISSING = "—";

function formatOptionalMoney(value: number | null): string {
  return typeof value === "number" ? formatMoney(value) : MISSING;
}

export function CommissionTable({
  policies,
}: Readonly<{ policies: ReadonlyArray<CommissionPolicy> }>) {
  const t = useTranslations("admin.settings");
  const router = useRouter();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">{t("table.caption")}</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3">{t("table.staff")}</th>
            <th scope="col" className="px-3 py-3">{t("table.status")}</th>
            <th scope="col" className="px-3 py-3">{t("table.rate")}</th>
            <th scope="col" className="px-3 py-3">{t("table.personalRevenue")}</th>
            <th scope="col" className="px-3 py-3">{t("table.staffPayout")}</th>
            <th scope="col" className="px-3 py-3">{t("table.salonShare")}</th>
            <th scope="col" className="px-3 py-3">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {policies.map((policy) => {
            const salonShare =
              typeof policy.personalRevenue === "number" && typeof policy.payout === "number"
                ? policy.personalRevenue - policy.payout
                : null;

            return (
              <tr key={policy.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" color="accent"><Avatar.Fallback>{policy.initials}</Avatar.Fallback></Avatar>
                    <strong>{policy.name}</strong>
                    {policy.roleLabel ? (
                      <Chip size="sm" variant="soft" color="accent"><Chip.Label>{policy.roleLabel}</Chip.Label></Chip>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Chip size="sm" variant="soft" color={policy.status === "working" ? "success" : "default"}>
                    <Chip.Label>{policy.status === "working" ? t("table.working") : t("table.leave")}</Chip.Label>
                  </Chip>
                </td>
                <td className="px-3 py-3">
                  <strong className="text-lg text-admin-accent">
                    {typeof policy.rate === "number" ? `${policy.rate}%` : MISSING}
                  </strong>
                </td>
                <td className="px-3 py-3 font-semibold">{formatOptionalMoney(policy.personalRevenue)}</td>
                <td className="px-3 py-3 font-bold text-admin-accent">{formatOptionalMoney(policy.payout)}</td>
                <td className="px-3 py-3">{formatOptionalMoney(salonShare)}</td>
                <td className="px-3 py-3">
                  {/* The compensation form lives on the staff screen; this used to be a button
                      with no handler at all. */}
                  <Button size="sm" variant="outline" className="rounded-lg border-admin-accent/30 text-admin-accent" onPress={() => router.push("/admin/staff")}><PencilSquareIcon className="size-4" />{t("table.edit")}</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
