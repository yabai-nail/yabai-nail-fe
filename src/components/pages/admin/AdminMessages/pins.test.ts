import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/service/api/contracts";
import { isPinLimitError, pinnedBoundaryIndex } from "./pins";

const row = (pinned: boolean) => ({ pinned });

describe("pinnedBoundaryIndex", () => {
  it("is the first unpinned row when both groups are present", () => {
    expect(pinnedBoundaryIndex([row(true), row(true), row(false), row(false)])).toBe(2);
  });
  it("is -1 when there is nothing to separate", () => {
    expect(pinnedBoundaryIndex([row(false), row(false)])).toBe(-1);
    expect(pinnedBoundaryIndex([row(true), row(true)])).toBe(-1);
    expect(pinnedBoundaryIndex([])).toBe(-1);
  });
});

describe("isPinLimitError", () => {
  it("recognises the API's pin-limit refusal only", () => {
    expect(isPinLimitError(new ApiClientError({ message: "x", code: "PIN_LIMIT_REACHED", status: 409 }))).toBe(true);
    expect(isPinLimitError(new ApiClientError({ message: "x", code: "VERSION_CONFLICT", status: 412 }))).toBe(false);
    expect(isPinLimitError(new Error("PIN_LIMIT_REACHED"))).toBe(false);
  });
});
