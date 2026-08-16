import { describe, expect, it } from "vitest";
import { calculateCommission } from "./admin-commission";

describe("calculateCommission", () => {
  it("calculates and rounds a valid commission", () => {
    expect(calculateCommission(950_000, 60)).toBe(570_000);
  });

  it("rejects rates outside the 0 to 100 range", () => {
    expect(() => calculateCommission(100_000, -1)).toThrow(RangeError);
    expect(() => calculateCommission(100_000, 101)).toThrow(RangeError);
  });

  it("rejects negative revenue", () => {
    expect(() => calculateCommission(-1, 50)).toThrow(RangeError);
  });
});
