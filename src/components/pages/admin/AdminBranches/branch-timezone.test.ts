import { describe, expect, it } from "vitest";

import { DEFAULT_TIME_ZONE } from "@/i18n/config";

import { initialBranchTimeZone } from "./branch-timezone";

describe("initialBranchTimeZone", () => {
  it("defaults a new branch to the shared Tokyo timezone", () => {
    expect(initialBranchTimeZone(null)).toBe(DEFAULT_TIME_ZONE);
    expect(initialBranchTimeZone(null)).toBe("Asia/Tokyo");
  });

  it("preserves an existing branch timezone", () => {
    expect(initialBranchTimeZone({ timezone: "Asia/Ho_Chi_Minh" })).toBe(
      "Asia/Ho_Chi_Minh",
    );
  });
});
