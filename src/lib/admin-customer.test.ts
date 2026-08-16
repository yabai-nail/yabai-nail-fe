import { describe, expect, it } from "vitest";
import { getCustomerSegmentLabel } from "./admin-customer";

describe("getCustomerSegmentLabel", () => {
  it.each([
    ["loyal", "Khách thân thiết"],
    ["new", "Khách mới"],
    ["regular", "Khách lâu năm"],
  ] as const)("maps %s to its Vietnamese label", (segment, label) => {
    expect(getCustomerSegmentLabel(segment)).toBe(label);
  });
});
