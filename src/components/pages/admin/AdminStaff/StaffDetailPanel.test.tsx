import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import messages from "../../../../../messages/vi.json";
import type { StaffMember } from "./data";
import { StaffDetailPanel } from "./StaffDetailPanel";

vi.mock("./StaffCompensationForm", () => ({ StaffCompensationForm: () => null }));
vi.mock("./StaffSkillsPanel", () => ({ StaffSkillsPanel: () => null }));
vi.mock("./StaffShiftsPanel", () => ({ StaffShiftsPanel: () => null }));
vi.mock("./StaffPerformancePanel", () => ({ StaffPerformancePanel: () => null }));
vi.mock("@/components/blocks/admin/AdminAvatarField", () => ({ AdminAvatarZoom: () => null }));

const member: StaffMember = {
  id: "staff", name: "Refund fixture", initials: "RF", phone: "", avatarUrl: null,
  status: "working", revenue: 35500, refundTotal: 5000, commissionAmount: 3050,
  commissionRate: 10, orders: 6, version: 1, branchId: "branch", branchName: "HIRO",
};
function render(refundTotal: number | null) {
  return renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}>
    <StaffDetailPanel member={{ ...member, refundTotal }} branchId="branch" period="2026-09" />
  </NextIntlClientProvider>);
}
it("renders the selected staff retained amount after refunds, not gross minus commission", () => {
  const markup = render(5000);
  expect(markup).toContain("27.450");
  expect(markup).not.toContain("32.450");
});
it("does not display an inflated remainder when legacy refund data is missing", () => {
  const markup = render(null);
  expect(markup).not.toContain("32.450");
  expect(markup).not.toContain("27.450");
  expect(markup).toContain("—");
});
