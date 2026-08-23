"use client";

import { BanknotesIcon, BuildingStorefrontIcon, PlusIcon, UserGroupIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Button, Card, Switch, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { calculateCommission } from "@/lib/admin-commission";
import { formatVnd } from "@/lib/admin-format";
import { useAdminStaff } from "@/service";
import { CommissionTable } from "./CommissionTable";
import { SettingsAside } from "./SettingsAside";
import { commissionPolicies as fixturePolicies, type CommissionPolicy } from "./data";

const settingsTabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "salon", label: "Thông tin tiệm" },
  { id: "booking", label: "Đặt lịch" },
  { id: "commission", label: "Nhân viên & Hoa hồng" },
  { id: "payment", label: "Thanh toán" },
  { id: "automation", label: "Tin nhắn tự động" },
  { id: "notifications", label: "Thông báo" },
  { id: "backup", label: "Sao lưu dữ liệu" },
] as const;

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function AdminSettingsComponent() {
  const [activeTab, setActiveTab] = useState("commission");
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [showRate, setShowRate] = useState(true);

  // Wire the commission tab against the real staff roster. Rate + revenue
  // are not exposed on the staff endpoint — those live on the per-staff
  // `useStaffCompensation` reads and would need N parallel calls to fill
  // the table. Fixture values remain until a batched compensation endpoint
  // (or a client-side fan-out) lands. Names / status / count are real.
  const { data: staffData, error: staffError } = useAdminStaff();
  const commissionPolicies = useMemo<ReadonlyArray<CommissionPolicy>>(() => {
    const staffItems = staffData?.items;
    if (!staffItems) return fixturePolicies;
    if (staffItems.length === 0) return [];
    return staffItems.map((staff) => {
      // Preserve any existing fixture rate for a matching staff id so the
      // commission table's numbers stay coherent for design review; new
      // staff default to 40%.
      const existing = fixturePolicies.find((p) => p.staffId === staff.id);
      const name = staff.displayName || `Nhân viên #${staff.id.slice(0, 6)}`;
      return {
        id: existing?.id ?? `policy-${staff.id}`,
        staffId: staff.id,
        name,
        initials: deriveInitials(name),
        role: existing?.role,
        status: staff.active ? "working" : "leave",
        rate: existing?.rate ?? 40,
        previousRate: existing?.previousRate,
        effectiveFrom: existing?.effectiveFrom ?? "01/01/2026",
        personalRevenue: existing?.personalRevenue ?? 0,
      } satisfies CommissionPolicy;
    });
  }, [staffData]);

  const totalRevenue = commissionPolicies.reduce((sum, policy) => sum + policy.personalRevenue, 0);
  const totalCommission = commissionPolicies.reduce(
    (sum, policy) => sum + calculateCommission(policy.personalRevenue, policy.rate),
    0,
  );
  const averageRate = commissionPolicies.length === 0
    ? 0
    : commissionPolicies.reduce((sum, policy) => sum + policy.rate, 0) / commissionPolicies.length;
  const metrics = [
    { id: "staff", label: "Tổng nhân viên", value: String(commissionPolicies.length), detail: "Đang làm việc: 3", icon: UserGroupIcon, tone: "bg-admin-soft text-admin-accent" },
    { id: "rate", label: "Tỷ lệ hoa hồng TB", value: `${averageRate}%`, detail: "Trung bình", icon: BanknotesIcon, tone: "bg-amber-50 text-admin-warning" },
    { id: "commission", label: "Tổng tiền hoa hồng tháng này", value: formatVnd(totalCommission), detail: "05/2025", icon: WalletIcon, tone: "bg-green-50 text-admin-success" },
    { id: "shop", label: "Phần doanh thu thuộc tiệm", value: formatVnd(totalRevenue - totalCommission), detail: "05/2025", icon: BuildingStorefrontIcon, tone: "bg-purple-50 text-admin-violet" },
  ] as const;

  return (
    <AdminPageLayout>
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))} variant="secondary">
        <Tabs.ListContainer className="overflow-x-auto">
          <Tabs.List aria-label="Nhóm cài đặt">
            {settingsTabs.map((tab) => (
              <Tabs.Tab key={tab.id} id={tab.id}>
                <AdminTabLabel>{tab.label}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      {activeTab !== "commission" ? (
        <Card className="mt-4 rounded-lg border-admin-border bg-admin-surface shadow-none">
          <Card.Content className="p-12 text-center">
            <h2 className="font-bold">{settingsTabs.find((tab) => tab.id === activeTab)?.label}</h2>
            <p className="mt-2 text-sm text-admin-muted">Nhóm cài đặt này sẽ được phát triển ở giai đoạn tiếp theo.</p>
          </Card.Content>
        </Card>
      ) : (
        <CommissionSettings
          metrics={metrics}
          policies={commissionPolicies}
          hasStaffError={Boolean(staffError)}
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

function CommissionSettings({ metrics, policies, hasStaffError, autoCalculate, showRate, onAutoCalculateChange, onShowRateChange }: Readonly<{
  metrics: ReadonlyArray<CommissionMetric>;
  policies: ReadonlyArray<CommissionPolicy>;
  hasStaffError: boolean;
  autoCalculate: boolean;
  showRate: boolean;
  onAutoCalculateChange: (value: boolean) => void;
  onShowRateChange: (value: boolean) => void;
}>) {
  return (
    <>
      <section className="mt-4" aria-labelledby="commission-settings-heading">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 id="commission-settings-heading" className="text-lg font-bold">Nhân viên & Cài đặt hoa hồng</h2><p className="mt-1 text-sm text-admin-muted">Cài đặt tỷ lệ hoa hồng riêng cho từng nhân viên theo năng lực.</p></div>
          <Button variant="outline" className="rounded-lg border-admin-border">Hướng dẫn tính hoa hồng</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ id, label, value, detail, icon: Icon, tone }) => (
            <Card key={id} className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
              <Card.Content className="flex items-start gap-3 p-4"><span className={`grid size-11 place-items-center rounded-lg ${tone}`}><Icon className="size-6" /></span><div><p className="text-xs">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-xs text-admin-muted">{detail}</p></div></Card.Content>
            </Card>
          ))}
        </div>
      </section>
      <div className="mt-4">
        <AdminSplitLayout asideWidth="sm" aside={<SettingsAside />}>
          <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Header className="flex items-center justify-between px-4 pt-4"><h2 className="font-bold">Danh sách nhân viên & tỷ lệ hoa hồng</h2><Button size="sm" variant="outline" className="rounded-lg border-admin-accent/30 text-admin-accent"><PlusIcon className="size-4" />Thêm nhân viên</Button></Card.Header>
            <Card.Content className="min-w-0 p-0 pt-2">
              {hasStaffError ? (
                <p className="mx-4 mb-2 text-xs text-admin-danger">
                  Không tải được danh sách nhân viên — hiển thị dữ liệu mẫu.
                </p>
              ) : null}
              <CommissionTable policies={policies} />
              <CommissionGuide />
            </Card.Content>
          </Card>
        </AdminSplitLayout>
      </div>
      <Card className="mt-4 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center"><div className="mr-auto"><h2 className="font-bold">Cài đặt chung</h2><p className="mt-1 text-xs text-admin-muted">Quy tắc làm tròn tiền hoa hồng: Làm tròn đến đơn vị 100đ</p></div><LabeledSwitch label="Tự động tính hoa hồng khi thanh toán đơn" value={autoCalculate} onChange={onAutoCalculateChange} /><LabeledSwitch label="Hiển thị % hoa hồng với nhân viên" value={showRate} onChange={onShowRateChange} /></Card.Content>
      </Card>
    </>
  );
}

function CommissionGuide() {
  const steps = [
    ["Doanh thu cá nhân", "Tổng giá trị dịch vụ nhân viên thực hiện"],
    ["% Hoa hồng", "Theo tỷ lệ cài đặt riêng"],
    ["Tiền nhân viên nhận", "Doanh thu × % hoa hồng"],
    ["Phần tiệm nhận", "Doanh thu − tiền nhân viên nhận"],
  ] as const;
  return <section className="border-t border-admin-border p-4" aria-labelledby="commission-formula-heading"><h3 id="commission-formula-heading" className="font-bold">Cách tính hoa hồng</h3><div className="mt-3 grid gap-2 md:grid-cols-4">{steps.map(([title, detail]) => <div key={title} className="rounded-lg border border-admin-border p-3 text-center"><strong className="text-xs">{title}</strong><p className="mt-1 text-[0.7rem] leading-4 text-admin-muted">{detail}</p></div>)}</div></section>;
}

function LabeledSwitch({ label, value, onChange }: Readonly<{ label: string; value: boolean; onChange: (value: boolean) => void }>) {
  return <div className="flex items-center gap-2 text-xs"><span>{label}</span><Switch isSelected={value} onChange={onChange} aria-label={label}><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content></Switch><strong>{value ? "Bật" : "Tắt"}</strong></div>;
}

export const meta = { world: "connected", domain: "admin-settings" } as const;
