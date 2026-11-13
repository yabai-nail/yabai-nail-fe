import { describe, expect, it } from "vitest";
import { describeSaleRule, previewSalePrice, saleWindowPreset, salePrefill } from "./data";

const FRIDAY = new Date("2026-11-13T10:00:00+09:00");

describe("previewSalePrice", () => {
  it("takes a percentage off", () => {
    expect(previewSalePrice(7700, { type: "PERCENT", value: 20 })).toEqual({
      price: 6160,
      applies: true,
    });
  });

  it("does not apply a fixed price above the original", () => {
    expect(previewSalePrice(5000, { type: "FIXED", value: 5500 }).applies).toBe(false);
  });

  it("applies a fixed price below the original", () => {
    expect(previewSalePrice(7700, { type: "FIXED", value: 5500 })).toEqual({
      price: 5500,
      applies: true,
    });
  });
});

describe("saleWindowPreset", () => {
  it("today runs from now to the end of the Tokyo day", () => {
    expect(saleWindowPreset("today", FRIDAY)).toEqual({
      startsAt: "2026-11-13T01:00:00.000Z",
      endsAt: "2026-11-13T14:59:59.000Z",
    });
  });

  it("weekend runs Saturday 00:00 to Sunday 23:59:59 of this week", () => {
    expect(saleWindowPreset("weekend", FRIDAY)).toEqual({
      startsAt: "2026-11-13T15:00:00.000Z",
      endsAt: "2026-11-15T14:59:59.000Z",
    });
  });

  it("weekend starts from now when it is already the weekend", () => {
    const sunday = new Date("2026-11-15T10:00:00+09:00");
    expect(saleWindowPreset("weekend", sunday)).toEqual({
      startsAt: "2026-11-15T01:00:00.000Z",
      endsAt: "2026-11-15T14:59:59.000Z",
    });
  });

  it("week runs seven days from now", () => {
    expect(saleWindowPreset("week", FRIDAY)).toEqual({
      startsAt: "2026-11-13T01:00:00.000Z",
      endsAt: "2026-11-20T01:00:00.000Z",
    });
  });
});

describe("salePrefill", () => {
  it("splits, trims and drops empty ids", () => {
    const params = new URLSearchParams("designs=a, b,,c&services=d,");
    expect(salePrefill(params)).toEqual({ designs: ["a", "b", "c"], services: ["d"] });
  });

  it("returns empty lists when absent", () => {
    expect(salePrefill(new URLSearchParams())).toEqual({ designs: [], services: [] });
  });
});

describe("describeSaleRule", () => {
  const t = (key: "fixed" | "percent", values: Record<string, string | number>) =>
    `${key}:${JSON.stringify(values)}`;
  const money = (n: number) => `¥${n}`;

  it("describes a fixed rule with the formatted amount", () => {
    expect(describeSaleRule({ type: "FIXED", value: 5500 }, money, t)).toBe(
      'fixed:{"amount":"¥5500"}',
    );
  });

  it("describes a percent rule", () => {
    expect(describeSaleRule({ type: "PERCENT", value: 20 }, money, t)).toBe(
      'percent:{"percent":20}',
    );
  });
});
