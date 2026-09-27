import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ hook: 0, frozen: "Asia/Ho_Chi_Minh" as string | undefined, branch: "Asia/Tokyo", startsAt: "2026-09-27T07:00:00Z", paidAt: "2026-09-26T16:30:00Z", usePaidAt: true }));
vi.mock("react", async load => {
  const react = await load<typeof import("react")>();
  return { ...react, useState: (initial: unknown) => react.useState(state.hook++ === 0 ? "appointment" : initial) };
});
vi.mock("next-intl", () => ({
  useTranslations: () => Object.assign((key: string) => key, { has: () => false }),
  useFormatter: () => ({ dateTime: (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", ...options }).format(date) }),
}));
vi.mock("@heroui/react", () => {
  const Plain = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return { Card: Plain, Button: Plain, Chip: Object.assign(Plain, { Label: Plain }) };
});
vi.mock("@/components/blocks/admin/AdminPageLayout", () => ({ AdminPageLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/blocks/admin/AdminPagination", () => ({ AdminPagination: () => null }));
vi.mock("@/service", () => ({
  adminService: {}, useAdminBranch: () => ({ branchId: "branch" }),
  useAdminPermission: (permission: string) => permission === "refund.create.branch",
  useAdminBranchDetail: () => ({ data: { timezone: state.branch } }),
  useAdminAppointments: () => ({ data: { items: [{ id: "appointment", customerId: "customer", status: "COMPLETED", total: 6000, startsAt: state.startsAt, branchTimeZone: state.frozen }] } }),
  useAdminCustomers: () => ({ data: { items: [] } }),
  useAdminAppointmentPayments: () => ({ data: { items: [{ id: "payment", kind: "CAPTURE", status: "SUCCEEDED", method: "CASH", amount: 6000, ...(state.usePaidAt ? { paidAt: state.paidAt } : { createdAt: state.paidAt }) }] } }),
  useAdminPaymentRefund: () => ({}),
}));
import { AdminOperationsComponent } from "./component";
beforeEach(() => { Object.assign(state, { hook: 0, frozen: "Asia/Ho_Chi_Minh", branch: "Asia/Tokyo", startsAt: "2026-09-27T07:00:00Z", paidAt: "2026-09-26T16:30:00Z", usePaidAt: true }); });
it("uses the frozen HCM zone for appointment14:00 and payment23:30 instead of global Tokyo", () => {
  const html = renderToStaticMarkup(<AdminOperationsComponent />);
  expect(html).toContain("27/09, 14:00"); expect(html).toContain("26/09, 23:30"); expect(html).not.toContain("27/09, 01:30");
});
it("preserves frozen Tokyo despite current HCM branch and crosses the date boundary", () => {
  state.frozen = "Asia/Tokyo"; state.branch = "Asia/Ho_Chi_Minh";
  const html = renderToStaticMarkup(<AdminOperationsComponent />);
  expect(html).toContain("27/09, 16:00"); expect(html).toContain("27/09, 01:30");
});
it("uses selected branch zone for legacy appointment and createdAt transaction fallback", () => {
  state.frozen = undefined; state.branch = "Asia/Ho_Chi_Minh"; state.usePaidAt = false;
  const html = renderToStaticMarkup(<AdminOperationsComponent />);
  expect(html).toContain("27/09, 14:00"); expect(html).toContain("26/09, 23:30");
});
