import { describe, expect, it } from "vitest";

import { grantsAfter } from "./session-grants";

/**
 * AdminAuthGate shows a spinner while permissions are null. A mid-session
 * token rotation is the same session, so wiping the grants there unmounts the
 * whole console into a spinner nothing ever clears.
 */
describe("grantsAfter", () => {
  it("keeps the grants already loaded when the access token rotates", () => {
    expect(grantsAfter("rotated", ["appointment.read.branch"])).toEqual(["appointment.read.branch"]);
  });

  it("drops the grants on a fresh sign-in so they are fetched for the new user", () => {
    expect(grantsAfter("signed-in", ["appointment.read.branch"])).toBeNull();
  });
});
