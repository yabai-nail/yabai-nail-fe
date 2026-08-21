import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest, setAccessToken } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  setAccessToken: vi.fn(),
}));

vi.mock("../api", () => ({
  apiRequest,
  apiRoutes: { auth: { adminSession: "/admin/auth/sessions" } },
  setAccessToken,
}));

import { authService } from "./service";

describe("authService.loginAdmin", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    setAccessToken.mockReset();
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
    apiRequest.mockResolvedValue(session);

    await expect(
      authService.loginAdmin({ phone: "0900 000 003", password: "123456" }),
    ).resolves.toEqual(session);

    expect(apiRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/admin/auth/sessions",
      headers: {
        "Idempotency-Key": "1cbaa0aa-0325-4b2e-8cd1-43ce8328afcd",
      },
      data: { phone: "0900000003", password: "123456" },
    });
    expect(setAccessToken).toHaveBeenCalledWith("access-token");
  });

  it("does not change the current token when login fails", async () => {
    apiRequest.mockRejectedValue(new Error("Invalid credentials"));

    await expect(
      authService.loginAdmin({ phone: "0900000003", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
    expect(setAccessToken).not.toHaveBeenCalled();
  });
});
