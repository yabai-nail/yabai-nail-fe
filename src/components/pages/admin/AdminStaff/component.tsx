"use client";

import { BanknotesIcon, BuildingStorefrontIcon, PlusIcon, UserGroupIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { calculateCommission } from "@/lib/admin-commission";
import { formatVnd } from "@/lib/admin-format";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import { RecentOrdersTable } from "./RecentOrdersTable";
import { StaffDetailPanel } from "./StaffDetailPanel";
import { StaffTable } from "./StaffTable";
import { staffMembers, type StaffStatus } from "./data";

type StaffFilter = "all" | StaffStatus;

export function AdminStaffComponent() {
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [selectedId, setSelectedId] = useState(staffMembers[0].id);
  const visibleStaff = useMemo(
    () => staffMembers.filter((member) => filter === "all" || member.status === filter),
    [filter],
  );
  const selected = resolveVisibleSelection(visibleStaff, selectedId);
  const totalRevenue = staffMembers.reduce((sum, member) => sum + member.revenue, 0);
  const totalCommission = staffMembers.reduce(
    (sum, member) => sum + calculateCommission(member.revenue, member.commissionRate),
    0,
  );
  const metrics = [
    { id: "revenue", label: "Tổng doanh thu hôm nay", value: formatVnd(totalRevenue), detail: "10 đơn hàng", icon: BanknotesIcon, tone: "text-admin-accent bg-admin-soft" },
    { id: "commission", label: "Tổng hoa hồng phải trả", value: formatVnd(totalCommission), detail: "60% / Trung bình", icon: WalletIcon, tone: "text-admin-success bg-green-50" },
    { id: "shop", label: "Quán thực nhận hôm nay", value: formatVnd(totalRevenue - totalCommission), detail: "40% / Trung bình", icon: BuildingStorefrontIcon, tone: "text-admin-info bg-sky-50" },
    { id: "working", label: "Nhân viên đang làm", value: "3 / 4", detail: "1 nghỉ phép", icon: UserGroupIcon, tone: "text-admin-violet bg-purple-50" },
  ] as const;

  return (
    <AdminPageLayout>
      <section aria-label="Tổng quan nhân viên" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ id, label, value, detail, icon: Icon, tone }) => (
          <Card key={id} className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Content className="flex items-start gap-3 p-4">
              <span className={`grid size-11 place-items-center rounded-lg ${tone}`}><Icon className="size-6" /></span>
              <div><p className="text-xs font-semibold">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-2 text-xs text-admin-muted">{detail}</p></div>
            </Card.Content>
          </Card>
        ))}
      </section>
      <div className="mt-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs selectedKey={filter} onSelectionChange={(key) => setFilter(String(key) as StaffFilter)} variant="secondary">
          <Tabs.ListContainer className="max-w-full overflow-x-auto">
            <Tabs.List aria-label="Lọc nhân viên">
              <Tabs.Tab id="all">
                <AdminTabLabel>Tất cả nhân viên</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="working">
                <AdminTabLabel>Đang làm</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="leave">
                <AdminTabLabel>Nghỉ phép</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg border-admin-border">Hôm nay</Button>
          <Button variant="primary" className="rounded-lg"><PlusIcon className="size-4" />Thêm nhân viên</Button>
        </div>
      </div>
      <div className="mt-4 min-w-0">
        <AdminSplitLayout
          aside={
            selected ? (
              <StaffDetailPanel member={selected} />
            ) : (
              <AdminEmptySelection
                title="Không có nhân viên"
                description="Thay đổi bộ lọc để xem thông tin nhân viên."
              />
            )
          }
        >
          <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Content className="min-w-0 p-0"><StaffTable staff={visibleStaff} selectedId={selected?.id ?? null} onSelect={setSelectedId} /></Card.Content>
          </Card>
          <RecentOrdersTable />
        </AdminSplitLayout>
      </div>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-staff" } as const;
