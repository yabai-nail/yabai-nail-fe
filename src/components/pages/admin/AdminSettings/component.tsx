"use client";

import { BanknotesIcon, BuildingStorefrontIcon, PlusIcon, UserGroupIcon, WalletIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, Card, Switch, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { formatMoney } from "@/lib/admin-format";
import {
  averageCommissionRate,
  currentMonthPeriod,
  indexStaffPerformance,
} from "@/lib/admin-staff-performance";
import { useAdminBranch, useAdminStaff, useAdminStaffPerformance } from "@/service";
import { BranchSettingsForm } from "./BranchSettingsForm";
import { AppearanceSettings } from "./AppearanceSettings";
import { LanguageSettings } from "./LanguageSettings";
import { CommissionTable } from "./CommissionTable";
import { SettingsAside } from "./SettingsAside";
import type { CommissionPolicy } from "./data";

/** Ids only; the labels are read from admin.settings.tabs at render. */
const settingsTabIds = [
  "overview",
  "salon",
  "booking",
  "commission",
  "payment",
  "automation",
  "notifications",
  "backup",
] as const;

const MISSING = "—";

// `account.role` uses the same vocabulary as the admin session. Only a role
// above plain staff earns a chip; an unknown value is dropped rather than
// guessed at.
function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function formatOptionalMoney(value: number | null): string {
  return typeof value === "number" ? formatMoney(value) : MISSING;
}

export function AdminSettingsComponent() {
  const t = useTranslations("admin.settings");
  const { branchId } = useAdminBranch();
  const [activeTab, setActiveTab] = useState("commission");
  // Appended at render because their labels are the strings on this screen that
  // are already translated; the other eight are extracted in their own slice.
  const tabs = useMemo(
    () => [...settingsTabIds, "language", "appearance"].map((id) => ({ id, label: t(`tabs.${id}`) })),
    [t]
  );
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [showRate, setShowRate] = useState(true);
  const period = useMemo(() => currentMonthPeriod(new Date()), []);

  // The commission table is the staff roster joined with the branch
  // staff-performance read model: the roster carries identity, role and the
  // active flag, the read model carries rate, revenue and commission for the
  // period. Two requests, no per-staff fan-out.
  const staff = useAdminStaff();
  const performance = useAdminStaffPerformance(branchId, { period });
  const commissionPolicies = useMemo<ReadonlyArray<CommissionPolicy>>(() => {
    const byStaffId = indexStaffPerformance(performance.data?.rows);
    return (staff.data?.items ?? []).map((member) => {
      const row = byStaffId.get(member.id);
      const name = member.displayName || t("unnamedStaff");
      return {
        id: `policy-${member.id}`,
        staffId: member.id,
        name,
        initials: deriveInitials(name),
        roleLabel: (() => {
          const role = member.account?.role?.toUpperCase() ?? "";
          return t.has(`roles.${role}`) ? t(`roles.${role}`) : null;
        })(),
        status: member.active ? "working" : "leave",
        rate: row?.commissionRate ?? null,
        personalRevenue: row?.revenue ?? null,
        payout: row?.commissionAmount ?? null,
      } satisfies CommissionPolicy;
    });
  }, [staff.data, performance.data, t]);

  const kpi = performance.data?.kpi;
  const revenue = kpi?.revenue ?? null;
  const commission = kpi?.commissionAmount ?? null;
  const salonShare =
    typeof revenue === "number" && typeof commission === "number" ? revenue - commission : null;
  const averageRate = averageCommissionRate(commissionPolicies.map((policy) => policy.rate));
  const workingCount = commissionPolicies.filter((policy) => policy.status === "working").length;
  const metrics = [
    {
      id: "staff",
      label: t("metrics.totalStaff"),
      value: commissionPolicies.length === 0 ? MISSING : String(commissionPolicies.length),
      detail: t("metrics.workingDetail", { count: workingCount }),
      icon: UserGroupIcon,
      tone: "bg-admin-soft text-admin-accent",
    },
    {
      id: "rate",
      label: t("metrics.avgRate"),
      value: averageRate === null ? MISSING : `${averageRate}%`,
      detail: t("metrics.average"),
      icon: BanknotesIcon,
      tone: "bg-admin-warning/10 text-admin-warning",
    },
    {
      id: "commission",
      label: t("metrics.totalCommission"),
      value: formatOptionalMoney(commission),
      detail: period,
      icon: WalletIcon,
      tone: "bg-admin-success/10 text-admin-success",
    },
    {
      id: "shop",
      label: t("metrics.salonShare"),
      value: formatOptionalMoney(salonShare),
      detail: period,
      icon: BuildingStorefrontIcon,
      tone: "bg-admin-violet/10 text-admin-violet",
    },
  ] as const;

  return (
    <AdminPageLayout>
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))} variant="secondary">
        <Tabs.ListContainer className="overflow-x-auto">
          <Tabs.List aria-label={t("tabsLabel")}>
            {tabs.map((tab) => (
              <Tabs.Tab key={tab.id} id={tab.id}>
                <AdminTabLabel>{tab.label}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      {activeTab === "language" ? (
        <LanguageSettings />
      ) : activeTab === "appearance" ? (
        <AppearanceSettings />
      ) : activeTab === "booking" && branchId ? (
        <BranchSettingsForm branchId={branchId} />
      ) : activeTab !== "commission" ? (
        <Card className="mt-4 rounded-lg border-admin-border bg-admin-surface shadow-none">
          <Card.Content className="p-12 text-center">
            <h2 className="font-bold">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
            <p className="mt-2 text-sm text-admin-muted">{t("placeholder")}</p>
          </Card.Content>
        </Card>
      ) : (
        <CommissionSettings
          metrics={metrics}
          period={period}
          policies={commissionPolicies}
          isLoading={staff.isLoading}
          staffError={Boolean(staff.error)}
          performanceError={Boolean(performance.error)}
          autoCalculate={autoCalculate}
          showRate={showRate}
          onAutoCalculateChange={setAutoCalculate}
          onShowRateChange={setShowRate}
        />
      )}
    </AdminPageLayout>
  );
}

type CommissionMetric = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: typeof UserGroupIcon;
  readonly tone: string;
};

function CommissionSettings({
  metrics,
  period,
  policies,
  isLoading,
  staffError,
  performanceError,
  autoCalculate,
  showRate,
  onAutoCalculateChange,
  onShowRateChange,
}: Readonly<{
  metrics: ReadonlyArray<CommissionMetric>;
  period: string;
  policies: ReadonlyArray<CommissionPolicy>;
  isLoading: boolean;
  staffError: boolean;
  performanceError: boolean;
  autoCalculate: boolean;
  showRate: boolean;
  onAutoCalculateChange: (value: boolean) => void;
  onShowRateChange: (value: boolean) => void;
}>) {
  const t = useTranslations("admin.settings");
  const router = useRouter();
  return (
    <>
      <section className="mt-4" aria-labelledby="commission-settings-heading">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="commission-settings-heading" className="text-lg font-bold">{t("commission.heading")}</h2>
            <p className="mt-1 text-sm text-admin-muted">Tỷ lệ, doanh thu và hoa hồng của kỳ {period}.</p>
          </div>
          {/* "Hướng dẫn tính hoa hồng" pointed at documentation that does not exist. */}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ id, label, value, detail, icon: Icon, tone }) => (
            <Card key={id} className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
              <Card.Content className="flex flex-row items-start gap-3 p-4"><span className={`grid size-11 place-items-center rounded-lg ${tone}`}><Icon className="size-6" /></span><div><p className="text-xs">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-xs text-admin-muted">{detail}</p></div></Card.Content>
            </Card>
          ))}
        </div>
      </section>
      <div className="mt-4">
        <AdminSplitLayout asideWidth="sm" aside={<SettingsAside />}>
          <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Header className="flex flex-row items-center justify-between px-4 pt-4"><h2 className="font-bold">{t("commission.listHeading")}</h2><Button size="sm" variant="outline" className="rounded-lg border-admin-accent/30 text-admin-accent" onPress={() => router.push("/admin/staff")}><PlusIcon className="size-4" />{t("commission.addStaff")}</Button></Card.Header>
            <Card.Content className="min-w-0 p-0 pt-2">
              {staffError ? (
                <p role="alert" className="mx-4 mb-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                  Không tải được danh sách nhân viên.
                </p>
              ) : performanceError ? (
                <p role="alert" className="mx-4 mb-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                  Không tải được số liệu kỳ {period} — cột tỷ lệ, doanh thu và hoa hồng hiển thị “{MISSING}”.
                </p>
              ) : null}
              {isLoading ? (
                <p className="px-4 pb-4 text-xs text-admin-muted">{t("commission.loading")}</p>
              ) : policies.length === 0 ? (
                <p className="px-4 pb-4 text-xs text-admin-muted">
                  {staffError ? t("commission.retry") : t("commission.noStaff")}
                </p>
              ) : (
                <CommissionTable policies={policies} />
              )}
              <CommissionGuide />
            </Card.Content>
          </Card>
        </AdminSplitLayout>
      </div>
      <Card className="mt-4 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center"><div className="mr-auto"><h2 className="font-bold">{t("commission.generalHeading")}</h2><p className="mt-1 text-xs text-admin-muted">{t("commission.generalNote")}</p></div><LabeledSwitch label={t("commission.autoCalculate")} value={autoCalculate} onChange={onAutoCalculateChange} /><LabeledSwitch label={t("commission.showRate")} value={showRate} onChange={onShowRateChange} /></Card.Content>
      </Card>
    </>
  );
}

function CommissionGuide() {
  const t = useTranslations("admin.settings");
  const steps = [
    [t("formula.revenueTitle"), t("formula.revenueDetail")],
    [t("formula.rateTitle"), t("formula.rateDetail")],
    [t("formula.staffTitle"), t("formula.staffDetail")],
    [t("formula.salonTitle"), t("formula.salonDetail")],
  ] as const;
  return <section className="border-t border-admin-border p-4" aria-labelledby="commission-formula-heading"><h3 id="commission-formula-heading" className="font-bold">{t("formula.heading")}</h3><div className="mt-3 grid gap-2 md:grid-cols-4">{steps.map(([title, detail]) => <div key={title} className="rounded-lg border border-admin-border p-3 text-center"><strong className="text-xs">{title}</strong><p className="mt-1 text-[0.7rem] leading-4 text-admin-muted">{detail}</p></div>)}</div></section>;
}

function LabeledSwitch({ label, value, onChange }: Readonly<{ label: string; value: boolean; onChange: (value: boolean) => void }>) {
  const t = useTranslations("admin.settings");
  return <div className="flex items-center gap-2 text-xs"><span>{label}</span><Switch isSelected={value} onChange={onChange} aria-label={label}><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content></Switch><strong>{value ? t("switchOn") : t("switchOff")}</strong></div>;
}

export const meta = { world: "connected", domain: "admin-settings" } as const;
