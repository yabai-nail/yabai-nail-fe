import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/vi.json";
import { formatMoney } from "@/lib/admin-format";

const state = vi.hoisted(() => ({ revenue: 17700, refundTotal: 6000 as number | undefined, commissionAmount: 1170 }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/service", () => ({
  useAdminBranch: () => ({ branchId: "branch" }),
  useAdminPermission: () => true,
  useAdminStaff: () => ({ data: { items: [{ id: "staff", displayName: "Fixture", active: true }] } }),
  useAdminStaffPerformance: () => ({ data: { kpi: state, rows: [{ staff: { id: "staff" }, ...state }] } }),
}));
vi.mock("@heroui/react", () => {
  const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return { Button: Box, Card: Object.assign(Box, { Content: Box, Header: Box }), Tabs: Object.assign(Box, { ListContainer: Box, List: Box, Tab: Box, Indicator: Box }), Avatar: Object.assign(Box, { Fallback: Box }), Chip: Object.assign(Box, { Label: Box }) };
});
vi.mock("@/components/blocks/admin/AdminPageLayout", () => ({ AdminPageLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/blocks/admin/AdminSplitLayout", () => ({ AdminSplitLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("./BranchSettingsForm", () => ({ BranchSettingsForm: () => null }));
vi.mock("./AppearanceSettings", () => ({ AppearanceSettings: () => null }));
vi.mock("./LanguageSettings", () => ({ LanguageSettings: () => null }));
vi.mock("./AccountProfileSettings", () => ({ AccountProfileSettings: () => null }));
vi.mock("./AccountSecuritySettings", () => ({ AccountSecuritySettings: () => null }));
vi.mock("./SettingsAside", () => ({ SettingsAside: () => null }));
import { AdminSettingsComponent } from "./component";

describe("settings salon remainder uses the same refund contract as staff performance", () => {
  it.each([
    [17700, 6000, 1170, 10530],
    [6000, 6000, 0, 0],
    [11700, 0, 1170, 10530],
    [1000, 1000, -100, 100],
    [1000, 1000, 100, -100],
    [6000, undefined, 0, null],
  ])("renders gross %s / refund %s / signed commission %s correctly in KPI and row", (revenue, refundTotal, commissionAmount, expected) => {
    Object.assign(state, { revenue, refundTotal, commissionAmount });
    const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Tokyo"><AdminSettingsComponent /></NextIntlClientProvider>);
    const cells = Array.from(html.matchAll(/<td[^>]*>(.*?)<\/td>/g), (match) => match[1]);
    const value = expected === null ? "—" : formatMoney(expected);
    expect(cells[6]).toBe(value);
    expect(html).toContain(`${messages.admin.settings.metrics.salonShare}</p><p class="mt-1 text-xl font-bold">${value}</p>`);
    expect(cells[4]).toBe(formatMoney(revenue));
    expect(html).toContain("Doanh thu − hoàn tiền − tiền nhân viên nhận");
  });
});
