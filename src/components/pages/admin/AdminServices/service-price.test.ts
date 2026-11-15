import { describe, expect, it } from "vitest";
import type { AdminPriceTier } from "@/service";
import { isServicePriceReady, servicePricePayload, type ServicePriceState } from "./service-price";

const tiers: ReadonlyArray<AdminPriceTier> = [
  { id: "t1", name: "Đồng giá 6600", amount: 6600, designCount: 2, serviceCount: 1, version: 1 },
  { id: "t2", name: "Đồng giá 8800", amount: 8800, designCount: 0, serviceCount: 0, version: 1 },
];
const tier = (tierId: string, manualPrice: number | null = 5000): ServicePriceState => ({ mode: "tier", tierId, manualPrice });
const custom = (manualPrice: number | null): ServicePriceState => ({ mode: "custom", tierId: "", manualPrice });

describe("service price payload", () => {
  it("create on a tier sends the tier id and its amount", () => {
    expect(servicePricePayload(tier("t1"), tiers, undefined, true)).toEqual({ priceTierId: "t1", price: 6600 });
  });

  it("create with a typed price leaves priceTierId out", () => {
    expect(servicePricePayload(custom(4400), tiers, undefined, true)).toEqual({ price: 4400 });
  });

  it("edit linking or switching tier sends only the id, so the tier owns the price", () => {
    expect(servicePricePayload(tier("t2"), tiers, null, true)).toEqual({ priceTierId: "t2" });
    expect(servicePricePayload(tier("t2"), tiers, "t1", true)).toEqual({ priceTierId: "t2" });
  });

  it("edit detaching sends null with the kept or retyped price", () => {
    expect(servicePricePayload(custom(6600), tiers, "t1", true)).toEqual({ priceTierId: null, price: 6600 });
    expect(servicePricePayload(custom(7000), tiers, "t1", true)).toEqual({ priceTierId: null, price: 7000 });
  });

  it("edit of an independent price never touches the link", () => {
    expect(servicePricePayload(custom(3000), tiers, null, true)).toEqual({ price: 3000 });
  });

  it("a linked service stays linked when the tiers cannot be read", () => {
    expect(servicePricePayload(tier("t1"), [], "t1", false)).toEqual({});
  });

  it("refuses a missing tier or an unparsable price", () => {
    expect(servicePricePayload(tier("gone"), tiers, null, true)).toBeNull();
    expect(servicePricePayload(custom(null), tiers, null, true)).toBeNull();
    expect(isServicePriceReady(tier("gone"), tiers, null, true, "BASE")).toBe(false);
  });

  it("applies the per-type amount rule to typed prices only", () => {
    expect(isServicePriceReady(custom(0), tiers, undefined, true, "BASE")).toBe(false);
    expect(isServicePriceReady(custom(0), tiers, undefined, true, "ADD_ON")).toBe(true);
    expect(isServicePriceReady(tier("t1"), tiers, undefined, true, "BASE")).toBe(true);
  });
});
