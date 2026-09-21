import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { adminRoutes, canAccessAdminRoute, getAdminRoute, groupAdminRoutes } from "./config";

const STAFF = [
  "appointment.read.assigned",
  "customer.read.assigned",
  "message.read.assigned",
  "payment.read.assigned",
  "staff.read.own",
  "catalog.read.branch",
  "review.read.branch",
  "appointment.queue.read.branch",
  "sales.report.write.own",
  "payroll.read.own",
  "profile.update.own",
] as const;

const MANAGER = [
  ...STAFF,
  "report.branch.read.branch",
  "appointment.read.branch",
  "customer.read.branch",
  "message.read.branch",
  "payment.read.branch",
  "staff.read.branch",
  "design.propose.branch",
  "sales.report.read.branch",
  "sales.report.approve.branch",
  "payroll.read.branch",
  "branch.read.branch",
  "refund.create.branch",
  "branch.settings.read.branch",
] as const;

const OWNER = [
  ...MANAGER,
  "design.manage.all",
  "promotion.read.all",
  "campaign.send.all",
  "report.revenue.read.all",
  "report.customer.read.all",
  "report.staff.read.all",
  "report.export.all",
  "branch.read.all",
  "account.read.all",
  "audit.read.all",
] as const;

function accessibleIds(permissions: ReadonlyArray<string>): string[] {
  return adminRoutes.filter((route) => canAccessAdminRoute(route, permissions)).map((route) => route.id);
}

describe("admin route and role matrix", () => {
  it("registers every physical admin page exactly once", () => {
    const appDirectory = join(process.cwd(), "src", "app", "(admin)", "admin");
    const physicalPaths = [
      "/admin",
      ...readdirSync(appDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `/admin/${entry.name}`),
    ].sort();
    const configuredPaths = adminRoutes.map((route) => route.href).sort();

    expect(configuredPaths).toEqual(physicalPaths);
    expect(new Set(configuredPaths).size).toBe(configuredPaths.length);
  });

  it("keeps assigned-only staff away from branch-wide CRM and roster pages", () => {
    expect(accessibleIds(STAFF)).toEqual([
      "appointments",
      "messages",
      "payments",
      "services",
      "reviews",
      "report",
      "my-payroll",
      "operations",
      "settings",
    ]);
  });

  it("gives managers the complete branch console without owner-only pages", () => {
    expect(accessibleIds(MANAGER)).toEqual([
      "dashboard",
      "appointments",
      "customers",
      "messages",
      "payments",
      "staff",
      "services",
      "nail-designs",
      "reviews",
      "sales-reports",
      "payroll",
      "report",
      "my-payroll",
      "branches",
      "operations",
      "settings",
    ]);
  });

  it("gives owners every registered route", () => {
    expect(accessibleIds(OWNER)).toEqual(adminRoutes.map((route) => route.id));
  });

  it("groups only accessible links and resolves nested paths to their parent route", () => {
    const groupedIds = groupAdminRoutes(MANAGER).flatMap((section) => section.routes.map((route) => route.id));
    expect([...groupedIds].sort()).toEqual([...accessibleIds(MANAGER)].sort());
    expect(getAdminRoute("/admin/appointments/example").id).toBe("appointments");
    expect(getAdminRoute("/admin/unknown").id).toBe("dashboard");
  });
});
