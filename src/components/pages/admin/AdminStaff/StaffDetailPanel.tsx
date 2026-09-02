import { useTranslations } from "next-intl";
import { PencilSquareIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Card, Chip } from "@heroui/react";
import { formatMoney } from "@/lib/admin-format";
import { StaffCompensationForm } from "./StaffCompensationForm";
import { StaffPerformancePanel } from "./StaffPerformancePanel";
import { StaffShiftsPanel } from "./StaffShiftsPanel";
import { StaffSkillsPanel } from "./StaffSkillsPanel";
import type { StaffMember } from "./data";

const MISSING = "—";

function formatOptionalMoney(value: number | null): string {
  return typeof value === "number" ? formatMoney(value) : MISSING;
}

const cellClass = "min-w-0 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none";

/**
 * Six sections about one person. They used to stack in the 17rem aside, which made the panel
 * 1350px tall while the column beside it sat empty -- so every field was cramped AND you had to
 * scroll to reach the shift controls. Across the full width they become a grid: two columns on a
 * normal screen, three on a wide one, and roughly a screenful in total.
 */
export function StaffDetailPanel({
  member,
  branchId,
  period,
  onEdit,
}: Readonly<{
  member: StaffMember;
  branchId?: string | null;
  period: string;
  onEdit?: () => void;
}>) {
  const t = useTranslations("admin.staff");
  const salonShare =
    typeof member.revenue === "number" && typeof member.commissionAmount === "number"
      ? member.revenue - member.commissionAmount
      : null;

  return (
    <section aria-label={`Chi tiết nhân viên ${member.name}`} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{t("detail.heading")}</h2>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-lg border-admin-border"
          isDisabled={!onEdit}
          onPress={onEdit}
        >
          <PencilSquareIcon className="size-4" />Chỉnh sửa
        </Button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className={cellClass}>
          <Card.Content className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg" color="accent"><Avatar.Fallback>{member.initials}</Avatar.Fallback></Avatar>
              <div className="min-w-0">
                <p className="truncate font-bold">{member.name}</p>
                <Chip size="sm" variant="soft" color={member.status === "working" ? "success" : "default"}>
                  <Chip.Label>{member.status === "working" ? t("tabs.working") : t("tabs.off")}</Chip.Label>
                </Chip>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <PhoneIcon className="size-4 text-admin-muted" />
                <dt className="sr-only">{t("detail.phone")}</dt>
                <dd>{member.phone || MISSING}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t("detail.commissionRate")}</dt>
                <dd className="font-bold">
                  {typeof member.commissionRate === "number" ? `${member.commissionRate}%` : MISSING}
                </dd>
              </div>
            </dl>
            <div className="border-t border-admin-border pt-4">
              <h3 className="font-bold">Doanh thu kỳ {period}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-admin-muted">{t("detail.totalRevenue")}</dt><dd className="font-semibold">{formatOptionalMoney(member.revenue)}</dd></div>
                <div className="flex justify-between"><dt className="text-admin-muted">{t("compensation.commission")}</dt><dd className="font-semibold text-admin-accent">{formatOptionalMoney(member.commissionAmount)}</dd></div>
                <div className="flex justify-between"><dt className="text-admin-muted">{t("metrics.salonShare")}</dt><dd className="font-semibold">{formatOptionalMoney(salonShare)}</dd></div>
                <div className="flex justify-between"><dt className="text-admin-muted">{t("detail.completedOrders")}</dt><dd className="font-semibold">{member.orders ?? MISSING}</dd></div>
              </dl>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-admin-soft p-3">
                <span className="font-semibold text-admin-accent">{t("detail.payout")}</span>
                <strong className="text-xl text-admin-accent">{formatOptionalMoney(member.commissionAmount)}</strong>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className={cellClass}>
          <Card.Content className="p-4">
            <StaffCompensationForm staffId={member.id} />
          </Card.Content>
        </Card>

        <Card className={cellClass}>
          <Card.Content className="p-4">
            <StaffSkillsPanel staffId={member.id} staffVersion={member.version} />
          </Card.Content>
        </Card>

        {branchId ? (
          <>
            <Card className={cellClass}>
              <Card.Content className="p-4">
                <StaffShiftsPanel branchId={branchId} staffId={member.id} />
              </Card.Content>
            </Card>
            <Card className={cellClass}>
              <Card.Content className="p-4">
                <StaffPerformancePanel branchId={branchId} staffId={member.id} />
              </Card.Content>
            </Card>
          </>
        ) : null}
      </div>
    </section>
  );
}
