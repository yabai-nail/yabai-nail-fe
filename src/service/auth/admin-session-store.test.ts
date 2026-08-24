import { describe, expect, it } from "vitest";

import { parseStoredAdminSession } from "./admin-session-store";

// The stored blob is attacker-adjacent input: anything in localStorage can be
// edited by hand or left behind by an older build. A bad shape must read as
// "no session", never as a half-session that the boot refresh then sends.
describe("parseStoredAdminSession", () => {
  it("accepts a complete session", () => {
    const raw = JSON.stringify({ sessionId: "s-1", refreshToken: "r-1" });
    expect(parseStoredAdminSession(raw)).toEqual({
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
    ]) {
      expect(parseStoredAdminSession(raw)).toBeNull();
    }
  });
});
