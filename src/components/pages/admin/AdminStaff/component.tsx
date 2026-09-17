"use client";

import { useTranslations } from "next-intl";
import { BanknotesIcon, BuildingStorefrontIcon, PlusIcon, UserGroupIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { formatMoney } from "@/lib/admin-format";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  averageCommissionRate,
  currentMonthPeriod,
  indexStaffPerformance,
  type StaffPerformanceRow,
} from "@/lib/admin-staff-performance";
import {
  useAdminBranch,
  useAdminBranchList,
  useAdminStaff,
  useAdminStaffMember,
  useAdminStaffPerformance,
  useAdminPermission,
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

function formatOptionalMoney(value: number | null): string {
  return typeof value === "number" ? formatMoney(value) : MISSING;
}

/**
 * Roster record + that member's period row. Revenue, order count and
 * commission live only on the staff-performance read model; the roster call
 * carries identity and the active flag. A member with no row for the period
 * keeps `null` money fields so the table can say so.
 */
function toStaffMember(server: ServerStaff, performance: StaffPerformanceRow | undefined, unnamed: string, branchName: string | null): StaffMember {
  const name = server.displayName || unnamed;
  return {
    id: server.id,
    name,
    initials: deriveInitials(name),
    phone: server.account?.phone ?? "",
    status: server.active ? "working" : "leave",
    revenue: performance?.revenue ?? null,
    commissionRate: performance?.commissionRate ?? null,
    commissionAmount: performance?.commissionAmount ?? null,
    orders: performance?.orderCount ?? null,
    version: server.version,
    branchId: server.branchId,
    branchName,
  };
}

export function AdminStaffComponent() {
  const t = useTranslations("admin.staff");
  const { branchId } = useAdminBranch();
  const canWriteStaff = useAdminPermission("staff.write.branch");
  const period = useMemo(() => currentMonthPeriod(new Date()), []);
  const [filter, setFilter] = useState<StaffFilter>("all");
  // No `branchId` here on purpose. The roster is the org-level list its branch column says
  // it is, and the backend already scopes it by role when no branch is asked for: an owner
  // sees every branch, a manager only the ones they are assigned. Asking for the console's
  // active branch instead made a transfer look like a deletion — the member dropped out of
  // the list the moment they were moved, and with the branch switcher hidden there was no
  // way left to reach them.
  const { data, isLoading, error, mutate: mutateStaff } = useAdminStaff({
    status: filter === "all" ? undefined : filter === "working" ? "ACTIVE" : "INACTIVE",
  });
  const performance = useAdminStaffPerformance(branchId, { period });
  // The roster is org-level, so a row needs to say which salon it belongs to.
  // The roster carries only `branchId`; the names come from the branch list the
  // header selector already reads.
  const branches = useAdminBranchList();
  const branchNameById = useMemo(
    () => new Map((branches.data?.items ?? []).map((branch) => [branch.id, branch.name] as const)),
    [branches.data],
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const performanceById = useMemo(
    () => indexStaffPerformance(performance.data?.rows),
    [performance.data],
  );
  const source = useMemo<ReadonlyArray<StaffMember>>(
    () => (data?.items ?? []).map((member) => toStaffMember(member, performanceById.get(member.id), t("unnamed"), branchNameById.get(member.branchId) ?? null)),
    [data, performanceById, t, branchNameById],
  );

  const [selectedId, setSelectedId] = useState<string>("");
  const visibleStaff = useMemo(
    () => source.filter((member) => filter === "all" || member.status === filter),
    [source, filter],
  );
  const selected = resolveVisibleSelection(visibleStaff, selectedId || visibleStaff[0]?.id || "");
  const staffDetail = useAdminStaffMember(selected?.id ?? null);
  const detailedStaff = staffDetail.data
    ? toStaffMember(staffDetail.data, performanceById.get(staffDetail.data.id), t("unnamed"), branchNameById.get(staffDetail.data.branchId) ?? null)
    : selected;

  const kpi = performance.data?.kpi;
  const revenue = kpi?.revenue ?? null;
  const commission = kpi?.commissionAmount ?? null;
  const salonShare =
    typeof revenue === "number" && typeof commission === "number" ? revenue - commission : null;
  const averageRate = averageCommissionRate(source.map((member) => member.commissionRate));
  const workingCount = source.filter((member) => member.status === "working").length;
  const metrics = [
    {
      id: "revenue",
      label: t("metrics.periodRevenue", { period }),
      value: formatOptionalMoney(revenue),
      detail: typeof kpi?.orderCount === "number" ? t("metrics.orderCount", { count: kpi.orderCount }) : t("metrics.noOrders"),
      icon: BanknotesIcon,
      tone: "text-admin-accent bg-admin-soft",
    },
    {
      id: "commission",
      label: t("metrics.commissionDue"),
      value: formatOptionalMoney(commission),
      detail: averageRate === null ? t("metrics.noRate") : t("metrics.rateDetail", { rate: averageRate }),
      icon: WalletIcon,
      tone: "text-admin-success bg-admin-success/10",
    },
    {
      id: "shop",
      label: t("metrics.salonShare"),
      value: formatOptionalMoney(salonShare),
      detail: t("metrics.period", { period }),
      icon: BuildingStorefrontIcon,
      tone: "text-admin-info bg-admin-info/10",
    },
    {
      id: "working",
      label: t("metrics.working"),
      value: source.length === 0 ? MISSING : `${workingCount} / ${source.length}`,
      detail: t("metrics.offCount", { count: source.length - workingCount }),
      icon: UserGroupIcon,
      tone: "text-admin-violet bg-admin-violet/10",
    },
  ] as const;

  return (
    <AdminPageLayout>
      <section aria-label={t("overviewRegion")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            <Tabs.List aria-label={t("tabsLabel")}>
              <Tabs.Tab id="all">
                <AdminTabLabel>{t("tabs.all")}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="working">
                <AdminTabLabel>{t("tabs.working")}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="leave">
                <AdminTabLabel>{t("tabs.off")}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <Button
          variant="primary"
          className="rounded-lg"
          isDisabled={!branchId || !canWriteStaff}
          onPress={() => setIsCreateOpen(true)}
        >
          <PlusIcon className="size-4" />{t("add")}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          {t("loadingFailed")}
        </p>
      ) : performance.error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          {t("performance.periodLoadFailed", { period, missing: MISSING })}
        </p>
      ) : null}
      <div className="mt-4 min-w-0">
        {isLoading ? (
          <p className="py-6 text-center text-xs text-admin-muted">{t("loading")}</p>
        ) : source.length === 0 ? (
          <Card className="rounded-lg border-admin-border bg-admin-surface shadow-none">
            <Card.Content className="p-12 text-center">
              <h2 className="font-bold">{t("emptyHeading")}</h2>
              <p className="mt-2 text-sm text-admin-muted">
                {error ? t("retry") : t("firstStaff")}
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
              <Card.Content className="min-w-0 p-0"><StaffTable
                staff={visibleStaff}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              /></Card.Content>
            </Card>
            {detailedStaff ? (
              // The member's own branch, not the console's active one. Shifts and leave are
              // written against whichever branch this panel is handed, so on an org-level
              // roster the active branch would book a technician a shift at a salon they do
              // not work at.
              <StaffDetailPanel
                member={detailedStaff}
                branchId={detailedStaff.branchId}
                period={period}
                onEdit={canWriteStaff ? () => setEditing(detailedStaff) : undefined}
              />
            ) : (
              <AdminEmptySelection
                title={t("noSelectionTitle")}
                description={t("noSelectionDescription")}
              />
            )}
            {detailedStaff ? (
              <RecentOrdersTable branchId={detailedStaff.branchId} staffId={detailedStaff.id} staffName={detailedStaff.name} />
            ) : null}
          </div>
        )}
      </div>
      {canWriteStaff && isCreateOpen && branchId ? (
        <StaffCreateModal
          branchId={branchId}
          branches={branches.data?.items ?? []}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void mutateStaff()}
        />
      ) : null}
      {canWriteStaff && editing ? (
        <StaffEditModal
          branches={branches.data?.items ?? []}
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            // The roster carries the branch the table prints, and the member read is what the
            // detail panel renders. A transfer changes both, so both have to be refetched.
            void mutateStaff();
            void staffDetail.mutate();
          }}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-staff" } as const;
