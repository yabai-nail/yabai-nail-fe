import { describe, expect, it } from "vitest";
import { getCustomerHistory } from "./data";

describe("getCustomerHistory", () => {
  it("returns history belonging to the selected customer", () => {
    expect(getCustomerHistory("c1")).not.toEqual(getCustomerHistory("c7"));
  });

  it("returns an empty list for a customer without history", () => {
    expect(getCustomerHistory("missing")).toEqual([]);
  });
});
