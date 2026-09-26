import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ query: "", action: "all", state: 0, audit: vi.fn() }));
vi.mock("react", async (load) => ({
  ...await load<typeof import("react")>(),
  useState: (initial: unknown) => [harness.state++ === 0 ? harness.query : harness.state === 2 ? harness.action : initial, vi.fn()],
}));
vi.mock("next-intl", () => ({ useTranslations: () => Object.assign((key: string) => ({
  "action.CUSTOMER_UPDATED": "Sửa khách hàng", "role.OWNER": "Chủ chuỗi", "resource.Customer": "Khách hàng",
}[key] ?? key), { has: () => true }) }));
vi.mock("@heroui/react", () => ({ Card: Object.assign(({ children }: { children: ReactNode }) => children, { Content: "section", Footer: "footer" }) }));
vi.mock("@/components/blocks/admin/AdminPageLayout", () => ({ AdminPageLayout: "main" }));
vi.mock("@/components/blocks/admin/AdminPagination", () => ({ AdminPagination: () => null }));
vi.mock("@/components/blocks/admin/AdminSearchField", () => ({ AdminSearchField: () => null }));
vi.mock("@/components/blocks/admin/AdminSelectField", () => ({ AdminSelectField: () => null }));
vi.mock("@/components/blocks/admin/AdminRecordDetail", () => ({ AdminRecordDetail: () => null }));
vi.mock("@/service", () => ({
  useAdminAuditLogs: harness.audit,
  useAdminAuditLog: () => ({}),
  useAdminAccounts: () => ({ data: { items: [{ id: "owner", displayName: "Admin", role: "OWNER" }, { id: "customer", displayName: "Khách 桜" }] } }),
  useAdminBranchList: () => ({ data: { items: [] } }),
  useAdminStaff: () => ({ data: { items: [] } }),
  useAdminServices: () => ({ data: { items: [] } }),
}));

import { AdminAuditLogsComponent } from "./component";

beforeEach(() => {
  harness.state = 0;
  harness.query = "";
  harness.action = "all";
  harness.audit.mockReset().mockReturnValue({ data: { items: [{
    id: "log", action: "CUSTOMER_UPDATED", actorId: "owner", resourceType: "Customer", resourceId: "customer", createdAt: "2026-09-26T00:00:00Z",
  }] } });
});

it.each(["Admin", "Khách 桜", "Sửa khách hàng", "CUSTOMER_UPDATED"])("searches displayed %s without server q pruning", (query) => {
  harness.query = query;
  const html = renderToStaticMarkup(<AdminAuditLogsComponent />);
  expect(harness.audit).toHaveBeenCalledWith({ action: undefined });
  expect(html).toContain("Chủ chuỗi · Admin");
  expect(html).toContain("Khách hàng · Khách 桜");
});

it("retains action intersection and returns empty for no matching display name", () => {
  harness.query = "does-not-exist";
  harness.action = "CUSTOMER_UPDATED";
  const html = renderToStaticMarkup(<AdminAuditLogsComponent />);
  expect(harness.audit).toHaveBeenCalledWith({ action: "CUSTOMER_UPDATED" });
  expect(html).toContain("empty");
  expect(html).not.toContain("Chủ chuỗi · Admin");
});
