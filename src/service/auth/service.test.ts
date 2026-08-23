import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeApiOperation, setAdminAccessToken } = vi.hoisted(() => ({
  executeApiOperation: vi.fn(),
  setAdminAccessToken: vi.fn(),
}));

vi.mock("../api", () => ({
  executeApiOperation,
  setAdminAccessToken,
}));

import { authService } from "./service";

describe("authService.loginAdmin", () => {
  beforeEach(() => {
    executeApiOperation.mockReset();
    setAdminAccessToken.mockReset();
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "1cbaa0aa-0325-4b2e-8cd1-43ce8328afcd",
    );
  });

  it("creates an admin session and keeps its access token in memory", async () => {
    const session = {
      sessionId: "session-1",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
      user: {
        id: "owner-1",
        displayName: "Chu chuoi YABAI",
        phone: "0900000003",
        role: "OWNER",
        locale: "vi",
        branchIds: ["branch-1"],
      },
    };
    executeApiOperation.mockResolvedValue(session);

    await expect(
      authService.loginAdmin({ phone: "0900 000 003", password: "123456" }),
    ).resolves.toEqual(session);

    // The service must reach the canonical operation string — the string that
    // the runtime catalog will resolve — so a route rename fails a test rather
    // than the login button.
    expect(executeApiOperation).toHaveBeenCalledWith(
      "POST /api/v1/admin/auth/sessions",
      {
        body: { phone: "0900000003", password: "123456" },
        idempotencyKey: undefined,
      },
    );
    expect(setAdminAccessToken).toHaveBeenCalledWith("access-token");
  });

  it("does not change the current token when login fails", async () => {
    executeApiOperation.mockRejectedValue(new Error("Invalid credentials"));

    await expect(
      authService.loginAdmin({ phone: "0900000003", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
    expect(setAdminAccessToken).not.toHaveBeenCalled();
  });
});
