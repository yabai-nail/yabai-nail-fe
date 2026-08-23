import { describe, expect, it } from "vitest";

import { getApiOperation } from "../api";
import { authService } from "./service";

// See customer-auth.test.ts for why the api module is NOT mocked here:
// the whole point is that these operation ids resolve against the real
// runtime catalog, so a route rename fails a test rather than the
// admin sign-in page.

const ADMIN_AUTH_OPERATION_IDS = [
  "POST /api/v1/admin/auth/sessions",
  "POST /api/v1/admin/auth/sessions/{sessionId}/branch",
  "GET /api/v1/admin/auth/session",
  "POST /api/v1/admin/auth/password-changes",
  "POST /api/v1/admin/auth/password-reset-requests",
  "POST /api/v1/admin/auth/password-resets",
] as const;

describe("admin auth surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of ADMIN_AUTH_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a service function for each admin auth operation", () => {
    for (const fn of [
      authService.loginAdmin,
      authService.adminSession,
      authService.switchAdminBranch,
      authService.changeAdminPassword,
      authService.requestAdminPasswordReset,
      authService.resetAdminPassword,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });
});
