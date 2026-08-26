"use client";

import { BanknotesIcon, BuildingStorefrontIcon, PlusIcon, UserGroupIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { formatVnd } from "@/lib/admin-format";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  averageCommissionRate,
  currentMonthPeriod,
  indexStaffPerformance,
  type StaffPerformanceRow,
} from "@/lib/admin-staff-performance";
import {
  useAdminBranch,
  useAdminStaff,
  useAdminStaffMember,
  useAdminStaffPerformance,
  type AdminStaffMember as ServerStaff,
} from "@/service";
import { RecentOrdersTable } from "./RecentOrdersTable";
import { StaffCreateModal } from "./StaffCreateModal";
import { StaffDetailPanel } from "./StaffDetailPanel";
import { StaffEditModal } from "./StaffEditModal";
import { StaffTable } from "./StaffTable";
import type { StaffMember, StaffStatus } from "./data";

type StaffFilter = "all" | StaffStatus;

const MISSING = "—";

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function formatOptionalVnd(value: number | null): string {
  return typeof value === "number" ? formatVnd(value) : MISSING;
}

/**
 * Roster record + that member's period row. Revenue, order count and
 * commission live only on the staff-performance read model; the roster call
 * carries identity and the active flag. A member with no row for the period
 * keeps `null` money fields so the table can say so.
 */
function toStaffMember(server: ServerStaff, performance: StaffPerformanceRow | undefined): StaffMember {
  const name = server.displayName || `Nhân viên #${server.id.slice(0, 6)}`;
  return {
    id: server.id,
    name,
    initials: deriveInitials(name),
    phone: server.account?.phone ?? "",
    status: server.active ? "working" : "leave",
    revenue: performance?.revenueVnd ?? null,
    commissionRate: performance?.commissionRate ?? null,
    commissionAmount: performance?.commissionAmountVnd ?? null,
    orders: performance?.orderCount ?? null,
    version: server.version,
  };
}

export function AdminStaffComponent() {
  const { branchId } = useAdminBranch();
  const period = useMemo(() => currentMonthPeriod(new Date()), []);
  const { data, isLoading, error, mutate: mutateStaff } = useAdminStaff();
  const performance = useAdminStaffPerformance(branchId, { period });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const performanceById = useMemo(
    () => indexStaffPerformance(performance.data?.rows),
    [performance.data],
  );
  const source = useMemo<ReadonlyArray<StaffMember>>(
    () => (data?.items ?? []).map((member) => toStaffMember(member, performanceById.get(member.id))),
    [data, performanceById],
  );

  const [filter, setFilter] = useState<StaffFilter>("all");
  const [selectedId, setSelectedId] = useState<string>("");
  const visibleStaff = useMemo(
    () => source.filter((member) => filter === "all" || member.status === filter),
    [source, filter],
  );
  const selected = resolveVisibleSelection(visibleStaff, selectedId || visibleStaff[0]?.id || "");
  const staffDetail = useAdminStaffMember(selected?.id ?? null);
  const detailedStaff = staffDetail.data
    ? toStaffMember(staffDetail.data, performanceById.get(staffDetail.data.id))
    : selected;

  const kpi = performance.data?.kpi;
  const revenue = kpi?.revenueVnd ?? null;
  const commission = kpi?.commissionAmountVnd ?? null;
  const salonShare =
    typeof revenue === "number" && typeof commission === "number" ? revenue - commission : null;
  const averageRate = averageCommissionRate(source.map((member) => member.commissionRate));
  const workingCount = source.filter((member) => member.status === "working").length;
  const metrics = [
    {
      id: "revenue",
      label: `Doanh thu kỳ ${period}`,
      value: formatOptionalVnd(revenue),
      detail: typeof kpi?.orderCount === "number" ? `${kpi.orderCount} đơn hàng` : "Chưa có số đơn",
      icon: BanknotesIcon,
      tone: "text-admin-accent bg-admin-soft",
    },
    {
      id: "commission",
      label: "Tổng hoa hồng phải trả",
      value: formatOptionalVnd(commission),
      detail: averageRate === null ? "Chưa có tỷ lệ" : `${averageRate}% / Trung bình`,
      icon: WalletIcon,
      tone: "text-admin-success bg-green-50",
    },
    {
      id: "shop",
      label: "Quán thực nhận",
      value: formatOptionalVnd(salonShare),
      detail: `Kỳ ${period}`,
      icon: BuildingStorefrontIcon,
      tone: "text-admin-info bg-sky-50",
    },
    {
      id: "working",
      label: "Nhân viên đang làm",
      value: source.length === 0 ? MISSING : `${workingCount} / ${source.length}`,
      detail: `${source.length - workingCount} nghỉ phép`,
      icon: UserGroupIcon,
      tone: "text-admin-violet bg-purple-50",
    },
  ] as const;

  return (
    <AdminPageLayout>
      <section aria-label="Tổng quan nhân viên" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ id, label, value, detail, icon: Icon, tone }) => (
          <Card key={id} className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Content className="flex flex-row items-start gap-3 p-4">
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
        <Button
          variant="primary"
          className="rounded-lg"
          isDisabled={!branchId}
          onPress={() => setIsCreateOpen(true)}
        >
          <PlusIcon className="size-4" />Thêm nhân viên
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          Không tải được danh sách nhân viên.
        </p>
      ) : performance.error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          Không tải được doanh thu kỳ {period} — cột doanh thu và hoa hồng hiển thị “{MISSING}”.
        </p>
      ) : null}
      <div className="mt-4 min-w-0">
        {isLoading ? (
          <p className="py-6 text-center text-xs text-admin-muted">Đang tải danh sách nhân viên…</p>
        ) : source.length === 0 ? (
          <Card className="rounded-lg border-admin-border bg-admin-surface shadow-none">
            <Card.Content className="p-12 text-center">
              <h2 className="font-bold">Chưa có nhân viên</h2>
              <p className="mt-2 text-sm text-admin-muted">
                {error ? "Thử tải lại trang." : "Thêm nhân viên đầu tiên để bắt đầu theo dõi doanh thu và hoa hồng."}
              </p>
            </Card.Content>
          </Card>
        ) : (
          <AdminSplitLayout
            aside={
              detailedStaff ? (
                <StaffDetailPanel
                  member={detailedStaff}
                  branchId={branchId}
                  period={period}
                  onEdit={() => setEditing(detailedStaff)}
                />
              ) : (
                <AdminEmptySelection
                  title="Không có nhân viên"
                  description="Thay đổi bộ lọc để xem thông tin nhân viên."
                />
              )
            }
          >
            <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
              <Card.Content className="min-w-0 p-0"><StaffTable
                staff={visibleStaff}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
                onEdit={(id) => { setSelectedId(id); setEditing(visibleStaff.find((member) => member.id === id) ?? null); }}
              /></Card.Content>
            </Card>
            {detailedStaff && branchId ? (
              <RecentOrdersTable branchId={branchId} staffId={detailedStaff.id} staffName={detailedStaff.name} />
            ) : null}
          </AdminSplitLayout>
        )}
      </div>
      {isCreateOpen && branchId ? (
        <StaffCreateModal
          branchId={branchId}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void mutateStaff()}
        />
      ) : null}
      {editing ? (
        <StaffEditModal
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={() => void mutateStaff()}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-staff" } as const;
