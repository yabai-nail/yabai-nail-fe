import { describe, expect, it } from "vitest";

import {
  CUSTOMER_SESSION_STORAGE_KEY,
  parseStoredCustomerSession,
} from "./customer-session-store";
import { ADMIN_SESSION_STORAGE_KEY } from "./admin-session-store";

// The stored blob is attacker-adjacent input: anything in localStorage can be
// edited by hand or left behind by an older build. A bad shape must read as
// "no session", never as a half-session that the boot refresh then sends.
describe("parseStoredCustomerSession", () => {
  it("accepts a complete session", () => {
    const raw = JSON.stringify({ sessionId: "s-1", refreshToken: "r-1" });
    expect(parseStoredCustomerSession(raw)).toEqual({
      sessionId: "s-1",
      refreshToken: "r-1",
    });
  });

  it("keeps only the two fields it knows about", () => {
    const raw = JSON.stringify({
      sessionId: "s-1",
      refreshToken: "r-1",
      accessToken: "leaked-access-token",
    });
    expect(parseStoredCustomerSession(raw)).toEqual({
      sessionId: "s-1",
      refreshToken: "r-1",
    });
  });

  it("rejects anything unusable", () => {
    for (const raw of [
      null,
      "",
      "not json",
      "null",
      '"a string"',
      "[]",
      JSON.stringify({ sessionId: "s-1" }),
      JSON.stringify({ refreshToken: "r-1" }),
      JSON.stringify({ sessionId: "", refreshToken: "r-1" }),
      JSON.stringify({ sessionId: "s-1", refreshToken: "" }),
      JSON.stringify({ sessionId: 1, refreshToken: "r-1" }),
      JSON.stringify({ sessionId: "s-1", refreshToken: 2 }),
      JSON.stringify({ sessionId: null, refreshToken: null }),
    ]) {
      expect(parseStoredCustomerSession(raw)).toBeNull();
    }
  });
});

// A shared key would let an admin sign-in evict a customer session in the same
// browser (and vice versa) — the exact confusion the split bearer slots exist
// to prevent.
describe("customer session storage key", () => {
  it("does not collide with the admin key", () => {
    expect(CUSTOMER_SESSION_STORAGE_KEY).not.toBe(ADMIN_SESSION_STORAGE_KEY);
  });
});
