import { describe, expect, it, vi } from "vitest";

/**
 * Mirrors the single-flight guard in context.tsx. Refresh tokens rotate and the
 * backend revokes the whole family when a spent one is replayed, so two callers
 * arriving at once — StrictMode's double effect, or several panels 401-ing
 * together — must share ONE exchange, not each send the same token.
 */
function makeRefreshOnce(refresh: (token: string) => Promise<string>) {
  let inFlight: Promise<string> | null = null;
  return (token: string) => {
    inFlight ??= refresh(token).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}

describe("refresh single-flight", () => {
  it("sends one request when two callers arrive together", async () => {
    const refresh = vi.fn(async () => "new-token");
    const refreshOnce = makeRefreshOnce(refresh);

    const [a, b] = await Promise.all([refreshOnce("spent"), refreshOnce("spent")]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(a).toBe("new-token");
    expect(b).toBe("new-token");
  });

  it("allows a later, separate refresh once the first settles", async () => {
    const refresh = vi.fn(async () => "new-token");
    const refreshOnce = makeRefreshOnce(refresh);

    await refreshOnce("first");
    await refreshOnce("second");

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("clears the slot after a failure so the next attempt is not stuck", async () => {
    const refresh = vi.fn(async () => {
      throw new Error("SESSION_EXPIRED");
    });
    const refreshOnce = makeRefreshOnce(refresh);

    await expect(refreshOnce("dead")).rejects.toThrow("SESSION_EXPIRED");
    await expect(refreshOnce("dead")).rejects.toThrow("SESSION_EXPIRED");
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
