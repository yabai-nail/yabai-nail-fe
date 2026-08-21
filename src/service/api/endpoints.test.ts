import { describe, expect, it } from "vitest";

import { apiRoutes } from "./endpoints";

describe("apiRoutes", () => {
  it("maps the backend v1 routes without repeating the API prefix", () => {
    expect(apiRoutes.auth.requestOtp).toBe("/auth/otp/request");
    expect(apiRoutes.auth.adminSession).toBe("/admin/auth/sessions");
    expect(apiRoutes.catalog.branches).toBe("/branches");
    expect(apiRoutes.admin.branchDashboard("branch-1")).toBe(
      "/admin/branches/branch-1/dashboard",
    );
  });

  it("encodes dynamic path segments", () => {
    expect(apiRoutes.catalog.branchService("branch/1", "service 2")).toBe(
      "/branches/branch%2F1/services/service%202",
    );
  });
});
