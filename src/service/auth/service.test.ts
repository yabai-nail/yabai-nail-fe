import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeApiOperation, setAdminAccessToken, setCustomerAccessToken } =
  vi.hoisted(() => ({
    executeApiOperation: vi.fn(),
    setAdminAccessToken: vi.fn(),
    setCustomerAccessToken: vi.fn(),
  }));

vi.mock("../api", () => ({
  executeApiOperation,
  setAdminAccessToken,
  setCustomerAccessToken,
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

// The axios interceptor picks a bearer slot from the request URL. A customer
// token written into the admin slot would ride along on every `/admin/*`
// request, so which setter each call reaches is the security boundary.
describe("authService customer OTP session", () => {
  beforeEach(() => {
    executeApiOperation.mockReset();
    setAdminAccessToken.mockReset();
    setCustomerAccessToken.mockReset();
  });

  it("verifying an OTP installs the token in the customer slot only", async () => {
    executeApiOperation.mockResolvedValue({
      sessionId: "session-9",
      accessToken: "customer-access-token",
      refreshToken: "customer-refresh-token",
      expiresIn: 3600,
    });

    await authService.verifyPhoneChallenge("challenge-9", { code: "123456" });

    expect(executeApiOperation).toHaveBeenCalledWith(
      "POST /api/v1/auth/phone/challenges/{challengeId}/verify",
      {
        path: { challengeId: "challenge-9" },
        body: { code: "123456" },
        idempotencyKey: undefined,
      },
    );
    expect(setCustomerAccessToken).toHaveBeenCalledWith("customer-access-token");
    expect(setAdminAccessToken).not.toHaveBeenCalled();
  });

  it("refreshing a customer session installs the rotated token", async () => {
    executeApiOperation.mockResolvedValue({
      sessionId: "session-10",
      accessToken: "rotated-access-token",
      refreshToken: "rotated-refresh-token",
      expiresIn: 3600,
    });

    await expect(
      authService.refreshSession({ refreshToken: "stored-refresh-token" }),
    ).resolves.toMatchObject({ refreshToken: "rotated-refresh-token" });

    expect(setCustomerAccessToken).toHaveBeenCalledWith("rotated-access-token");
    expect(setAdminAccessToken).not.toHaveBeenCalled();
  });

  it("strips spaces out of the phone before asking for an OTP", async () => {
    executeApiOperation.mockResolvedValue({
      challengeId: "challenge-9",
      maskedPhone: "09***78",
      expiresAt: "2026-01-01T00:05:00.000Z",
    });

    await authService.startPhoneChallenge({ phone: "091 234 5678" });

    expect(executeApiOperation).toHaveBeenCalledWith(
      "POST /api/v1/auth/phone/challenges",
      { body: { phone: "0912345678" }, idempotencyKey: undefined },
    );
  });
});
