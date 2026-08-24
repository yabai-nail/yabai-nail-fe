"use client";

import { Tabs } from "@heroui/react";
import { useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { useAuth } from "@/service";
import { AccountsTab } from "./AccountsTab";
import { AuditLogTab } from "./AuditLogTab";
import { LoyaltyConfigTab } from "./LoyaltyConfigTab";
import { SystemConfigTab } from "./SystemConfigTab";

type TabId = "system-config" | "loyalty" | "accounts" | "audit";

const ALL_TABS: ReadonlyArray<{ readonly id: TabId; readonly label: string; readonly ownerOnly: boolean }> = [
  { id: "system-config", label: "Cấu hình hệ thống", ownerOnly: true },
  { id: "loyalty", label: "Tích điểm", ownerOnly: false },
  { id: "accounts", label: "Tài khoản", ownerOnly: true },
  { id: "audit", label: "Nhật ký", ownerOnly: false },
];

/**
 * System administration, gathered into one screen with four tabs. This is a
 * high-privilege surface: the system-config and accounts tabs — which can
 * reconfigure the whole chain or mint new admins — are shown only to an OWNER.
 * A manager sees only loyalty config and the audit log. The gate is by
 * mounting: a non-owner never renders (and never fires the hooks inside) the
 * restricted tabs.
 */
export function AdminSystemComponent() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((tab) => isOwner || !tab.ownerOnly),
    [isOwner],
  );

  const [activeTab, setActiveTab] = useState<TabId>(visibleTabs[0]?.id ?? "loyalty");

  // If the role resolves after first render and hides the current tab, fall back
  // to the first tab the user is actually allowed to see.
  const effectiveTab = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : visibleTabs[0]?.id ?? "loyalty";

  return (
    <AdminPageLayout>
      <Tabs
        selectedKey={effectiveTab}
        onSelectionChange={(key) => setActiveTab(String(key) as TabId)}
        variant="secondary"
      >
        <Tabs.ListContainer className="overflow-x-auto">
          <Tabs.List aria-label="Nhóm quản trị hệ thống">
            {visibleTabs.map((tab) => (
              <Tabs.Tab key={tab.id} id={tab.id}>
                <AdminTabLabel>{tab.label}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {effectiveTab === "system-config" && isOwner ? <SystemConfigTab /> : null}
      {effectiveTab === "loyalty" ? <LoyaltyConfigTab /> : null}
      {effectiveTab === "accounts" && isOwner ? <AccountsTab /> : null}
      {effectiveTab === "audit" ? <AuditLogTab /> : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-system" } as const;
