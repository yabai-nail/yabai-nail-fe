import { expect, it, vi } from "vitest";

vi.mock("@/components/pages/admin/AdminStaff", () => ({ AdminStaff: () => null }));
import AdminStaffPage from "./page";

it("forwards the branch and exact staff member from a commission edit link", async () => {
  const page = await AdminStaffPage({ searchParams: Promise.resolve({ branchId: "tenjin", id: "staff-yuki" }) });
  expect(page.props).toEqual({ initialBranchId: "tenjin", initialSelectedId: "staff-yuki" });
});
