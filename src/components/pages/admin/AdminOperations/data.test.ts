import { describe, expect, it } from "vitest";
import { formatVnd, parseVnd, summarizeCustomer } from "./data";

describe("operations helpers", () => {
  it("parses grouped VND strings to an integer", () => {
    expect(parseVnd("1.000.000")).toBe(1000000);
    expect(parseVnd("1,250,000 ₫")).toBe(1250000);
    expect(parseVnd("abc")).toBe(0);
  });

  it("formats VND with grouping and symbol", () => {
    expect(formatVnd(50000)).toBe("50.000 ₫");
  });

  it("summarizes a customer, preferring masked phone", () => {
    const hit = summarizeCustomer({ id: "c1", displayName: "An", phoneMasked: "09****01" } as never);
    expect(hit).toEqual({ id: "c1", name: "An", phone: "09****01" });
  });

  it("falls back to dashes when fields are missing", () => {
    const hit = summarizeCustomer({ id: "c2" } as never);
    expect(hit).toEqual({ id: "c2", name: "—", phone: "—" });
  });
});
