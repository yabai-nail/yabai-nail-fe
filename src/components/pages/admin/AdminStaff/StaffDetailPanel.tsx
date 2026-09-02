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
    <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="px-4 pt-4"><h2 className="font-bold">{t("detail.heading")}</h2></Card.Header>
      <Card.Content className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" color="accent"><Avatar.Fallback>{member.initials}</Avatar.Fallback></Avatar>
          <div>
            <p className="font-bold">{member.name}</p>
            <Chip size="sm" variant="soft" color={member.status === "working" ? "success" : "default"}>
              <Chip.Label>{member.status === "working" ? t("statusWorking") : t("statusOff")}</Chip.Label>
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
        <section className="border-t border-admin-border pt-4">
          <h3 className="font-bold">Doanh thu kỳ {period}</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-admin-muted">{t("detail.totalRevenue")}</dt><dd className="font-semibold">{formatOptionalMoney(member.revenue)}</dd></div>
            <div className="flex justify-between"><dt className="text-admin-muted">{t("detail.commission")}</dt><dd className="font-semibold text-admin-accent">{formatOptionalMoney(member.commissionAmount)}</dd></div>
            <div className="flex justify-between"><dt className="text-admin-muted">{t("detail.salonShare")}</dt><dd className="font-semibold">{formatOptionalMoney(salonShare)}</dd></div>
            <div className="flex justify-between"><dt className="text-admin-muted">{t("detail.completedOrders")}</dt><dd className="font-semibold">{member.orders ?? MISSING}</dd></div>
          </dl>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-admin-soft p-3">
            <span className="font-semibold text-admin-accent">{t("detail.payout")}</span>
            <strong className="text-xl text-admin-accent">{formatOptionalMoney(member.commissionAmount)}</strong>
          </div>
        </section>
        <StaffCompensationForm staffId={member.id} />
        <StaffSkillsPanel staffId={member.id} staffVersion={member.version} />
        {branchId ? (
          <>
            <StaffShiftsPanel branchId={branchId} staffId={member.id} />
            <StaffPerformancePanel branchId={branchId} staffId={member.id} />
          </>
        ) : null}
        <div className="grid gap-2">
          {/* Neither had a handler. The order history is already rendered below
              this panel by RecentOrdersTable, and no per-staff payment history
              exists to open. */}
          <Button
            variant="primary"
            className="rounded-lg"
            isDisabled={!onEdit}
            onPress={onEdit}
          >
            <PencilSquareIcon className="size-4" />Chỉnh sửa nhân viên
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
