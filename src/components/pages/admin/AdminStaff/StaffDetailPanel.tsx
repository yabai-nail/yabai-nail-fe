import { CalendarDaysIcon, PencilSquareIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Card, Chip } from "@heroui/react";
import { calculateCommission } from "@/lib/admin-commission";
import { formatVnd } from "@/lib/admin-format";
import { StaffCompensationForm } from "./StaffCompensationForm";
import { StaffShiftsPanel } from "./StaffShiftsPanel";
import { StaffSkillsPanel } from "./StaffSkillsPanel";
import type { StaffMember } from "./data";

export function StaffDetailPanel({
  member,
  branchId,
  onEdit,
}: Readonly<{
  member: StaffMember;
  branchId?: string | null;
  onEdit?: () => void;
}>) {
  const payout = calculateCommission(member.revenue, member.commissionRate);

  return (
    <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="px-4 pt-4"><h2 className="font-bold">Chi tiết nhân viên</h2></Card.Header>
      <Card.Content className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" color="accent"><Avatar.Fallback>{member.initials}</Avatar.Fallback></Avatar>
          <div>
            <p className="font-bold">{member.name}</p>
            <Chip size="sm" variant="soft" color={member.status === "working" ? "success" : "default"}>
              <Chip.Label>{member.status === "working" ? "Đang làm" : "Nghỉ phép"}</Chip.Label>
            </Chip>
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><PhoneIcon className="size-4 text-admin-muted" /><dd>{member.phone}</dd></div>
          <div className="flex gap-2"><CalendarDaysIcon className="size-4 text-admin-muted" /><dd>{member.birthday}</dd></div>
          <div className="flex items-center justify-between"><dt>Tỷ lệ hoa hồng</dt><dd className="font-bold">{member.commissionRate}%</dd></div>
        </dl>
        <section className="border-t border-admin-border pt-4">
          <h3 className="font-bold">Doanh thu hôm nay</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-admin-muted">Tổng doanh thu</dt><dd className="font-semibold">{formatVnd(member.revenue)}</dd></div>
            <div className="flex justify-between"><dt className="text-admin-muted">Hoa hồng</dt><dd className="font-semibold text-admin-accent">{formatVnd(payout)}</dd></div>
            <div className="flex justify-between"><dt className="text-admin-muted">Quán thực nhận</dt><dd className="font-semibold">{formatVnd(member.revenue - payout)}</dd></div>
          </dl>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-admin-soft p-3">
            <span className="font-semibold text-admin-accent">Nhận được</span>
            <strong className="text-xl text-admin-accent">{formatVnd(payout)}</strong>
          </div>
        </section>
        <section className="border-t border-admin-border pt-4">
          <h3 className="font-bold">Thống kê tháng này</h3>
          <p className="mt-3 flex justify-between text-sm"><span className="text-admin-muted">Số đơn hoàn thành</span><strong>54 đơn</strong></p>
        </section>
        {member.version !== undefined ? (
          <>
            <StaffCompensationForm staffId={member.id} />
            <StaffSkillsPanel staffId={member.id} staffVersion={member.version} />
            {branchId ? <StaffShiftsPanel branchId={branchId} staffId={member.id} /> : null}
          </>
        ) : null}
        <div className="grid gap-2">
          <Button variant="outline" className="rounded-lg border-admin-border">Lịch sử đơn hàng</Button>
          <Button variant="outline" className="rounded-lg border-admin-border">Lịch sử thanh toán</Button>
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
