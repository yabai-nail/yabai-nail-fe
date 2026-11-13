import { describe, expect, it } from "vitest";
import type { AdminSale } from "@/service";
import {
  buildSaleInput,
  describeSaleRule,
  designTarget,
  duplicateSaleForm,
  filterSaleTargets,
  fromTokyoParts,
  newSaleForm,
  previewSalePrice,
  SALE_NAME_MAX,
  saleCoverage,
  saleFormErrors,
  saleFormFromSale,
  saleFormScopes,
  saleLoweredCounts,
  saleOptionsStatus,
  salePreview,
  salesOnTier,
  saleWindowPreset,
  salePrefill,
  serviceTarget,
  tokyoParts,
} from "./data";

const FRIDAY = new Date("2026-11-13T10:00:00+09:00");

describe("previewSalePrice", () => {
  it("takes a percentage off", () => {
    expect(previewSalePrice(7700, { type: "PERCENT", value: 20 })).toEqual({
      price: 6160,
      applies: true,
    });
  });

  it("floors a non-integer percent price like the API", () => {
    expect(previewSalePrice(1001, { type: "PERCENT", value: 15 })).toEqual({
      price: 850,
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

  it("never applies a price below ¥1, like the API", () => {
    expect(previewSalePrice(50, { type: "PERCENT", value: 99 })).toEqual({ price: 0, applies: false });
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

describe("Tokyo date and time parts", () => {
  it("splits a UTC instant into the Tokyo date and minute", () => {
    expect(tokyoParts("2026-11-13T15:30:00.000Z")).toEqual({ date: "2026-11-14", time: "00:30" });
  });

  it("joins Tokyo parts back into a UTC ISO string", () => {
    expect(fromTokyoParts("2026-11-14", "00:30")).toBe("2026-11-13T15:30:00.000Z");
  });
});

const sale: AdminSale = {
  id: "s1",
  name: "Black Friday",
  startsAt: "2026-11-27T00:00:00.000Z",
  endsAt: "2026-11-29T15:00:00.000Z",
  endedAt: null,
  rule: { type: "PERCENT", value: 20 },
  designs: { mode: "TIERS", ids: ["t1"] },
  services: { mode: "ITEMS", ids: ["svc1", "svc2"] },
  status: "UPCOMING",
  version: 3,
};

describe("sale form state", () => {
  it("starts a new sale on the 7-day window with nothing covered", () => {
    expect(newSaleForm(FRIDAY)).toEqual({
      name: "",
      startsAt: "2026-11-13T01:00:00.000Z",
      endsAt: "2026-11-20T01:00:00.000Z",
      ruleType: "FIXED",
      ruleValue: "",
      designs: { mode: "NONE", groupIds: [], itemIds: [] },
      services: { mode: "NONE", groupIds: [], itemIds: [] },
    });
  });

  it("puts prefilled ids into the pick-each mode", () => {
    const form = newSaleForm(FRIDAY, { designs: ["d1"], services: [] });
    expect(form.designs).toEqual({ mode: "ITEMS", groupIds: [], itemIds: ["d1"] });
    expect(form.services.mode).toBe("NONE");
  });

  it("reads a saved sale into the form", () => {
    expect(saleFormFromSale(sale)).toEqual({
      name: "Black Friday",
      startsAt: sale.startsAt,
      endsAt: sale.endsAt,
      ruleType: "PERCENT",
      ruleValue: "20",
      designs: { mode: "GROUPS", groupIds: ["t1"], itemIds: [] },
      services: { mode: "ITEMS", groupIds: [], itemIds: ["svc1", "svc2"] },
    });
  });

  it("duplicates everything but the dates, under the new name", () => {
    const copy = duplicateSaleForm(sale, "Black Friday (bản sao)", FRIDAY);
    expect(copy).toMatchObject({
      name: "Black Friday (bản sao)",
      startsAt: "2026-11-13T01:00:00.000Z",
      endsAt: "2026-11-20T01:00:00.000Z",
      ruleType: "PERCENT",
      ruleValue: "20",
      designs: { mode: "GROUPS", groupIds: ["t1"] },
    });
  });

  it("cuts a duplicate name to the 120 characters the API keeps", () => {
    expect(duplicateSaleForm(sale, "x".repeat(130), FRIDAY).name).toHaveLength(SALE_NAME_MAX);
  });
});

describe("saleFormErrors and buildSaleInput", () => {
  const valid = {
    ...newSaleForm(FRIDAY),
    name: "  Tết  ",
    ruleValue: "5,500",
    designs: { mode: "ALL" as const, groupIds: [], itemIds: [] },
  };

  it("accepts a complete form and builds the API input", () => {
    expect(saleFormErrors(valid)).toEqual({});
    expect(buildSaleInput(valid)).toEqual({
      name: "Tết",
      startsAt: valid.startsAt,
      endsAt: valid.endsAt,
      rule: { type: "FIXED", value: 5500 },
      designs: { mode: "ALL", ids: [] },
      services: { mode: "NONE", ids: [] },
    });
  });

  it("maps the group mode to tiers for designs and categories for services", () => {
    const input = buildSaleInput({
      ...valid,
      designs: { mode: "GROUPS", groupIds: ["t1"], itemIds: ["d9"] },
      services: { mode: "GROUPS", groupIds: ["gel"], itemIds: [] },
    });
    expect(input?.designs).toEqual({ mode: "TIERS", ids: ["t1"] });
    expect(input?.services).toEqual({ mode: "CATEGORIES", ids: ["gel"] });
  });

  it("flags an empty or too long name", () => {
    expect(saleFormErrors({ ...valid, name: "   " })).toEqual({ name: true });
    expect(saleFormErrors({ ...valid, name: "x".repeat(121) })).toEqual({ name: true });
  });

  it("flags an end that is not after the start", () => {
    expect(saleFormErrors({ ...valid, endsAt: valid.startsAt })).toEqual({ endsAt: true });
  });

  it("flags rule values the API refuses", () => {
    expect(saleFormErrors({ ...valid, ruleValue: "" })).toEqual({ rule: true });
    expect(saleFormErrors({ ...valid, ruleValue: "0" })).toEqual({ rule: true });
    expect(saleFormErrors({ ...valid, ruleType: "PERCENT", ruleValue: "100" })).toEqual({ rule: true });
    expect(saleFormErrors({ ...valid, ruleType: "PERCENT", ruleValue: "15.5" })).toEqual({ rule: true });
    expect(saleFormErrors({ ...valid, ruleType: "PERCENT", ruleValue: "99" })).toEqual({});
    expect(buildSaleInput({ ...valid, ruleValue: "" })).toBeNull();
  });

  it("needs at least one block applied, and a pick in a pick mode", () => {
    expect(saleFormErrors({ ...valid, designs: { mode: "NONE", groupIds: [], itemIds: [] } })).toEqual({ scope: true });
    expect(saleFormErrors({ ...valid, designs: { mode: "ITEMS", groupIds: ["t1"], itemIds: [] } })).toEqual({ scope: true });
    expect(saleFormErrors({ ...valid, services: { mode: "GROUPS", groupIds: [], itemIds: [] } })).toEqual({ scope: true });
  });
});

describe("saleCoverage and salePreview", () => {
  const designs = [
    { id: "d1", groupId: "t1", name: "D1", price: 6600 },
    { id: "d2", groupId: "t2", name: "D2", price: 8800 },
    { id: "d3", groupId: null, name: "D3", price: null },
  ];
  const services = [
    { id: "svc1", groupId: "gel", name: "Gel", price: 5000 },
    { id: "svc2", groupId: "care", name: "Care", price: 3000 },
  ];

  it("lists what each scope mode covers", () => {
    const covered = (d: AdminSale["designs"], s: AdminSale["services"]) => {
      const result = saleCoverage({ designs: d, services: s }, designs, services);
      return [result.designs.map((x) => x.id), result.services.map((x) => x.id)];
    };
    expect(covered({ mode: "ALL", ids: [] }, { mode: "NONE", ids: [] })).toEqual([["d1", "d2", "d3"], []]);
    expect(covered({ mode: "TIERS", ids: ["t2"] }, { mode: "CATEGORIES", ids: ["gel"] })).toEqual([["d2"], ["svc1"]]);
    expect(covered({ mode: "ITEMS", ids: ["d1", "gone"] }, { mode: "ITEMS", ids: ["svc2"] })).toEqual([["d1"], ["svc2"]]);
  });

  it("previews priced items up to the limit with the total", () => {
    const preview = salePreview([...designs, ...services], { type: "PERCENT", value: 10 }, 2);
    expect(preview.total).toBe(4);
    expect(preview.notCheaper).toBe(0);
    expect(preview.rows.map((row) => [row.target.id, row.price, row.applies])).toEqual([
      ["d1", 5940, true],
      ["d2", 7920, true],
    ]);
  });

  it("counts items a fixed price would not lower", () => {
    const preview = salePreview([...designs, ...services], { type: "FIXED", value: 5500 });
    expect(preview.total).toBe(4);
    expect(preview.notCheaper).toBe(2);
    expect(preview.rows).toHaveLength(4);
  });

  it("counts only the items a sale actually lowers, like the tables' SALE chips", () => {
    const counts = (rule: AdminSale["rule"]) =>
      saleLoweredCounts({ rule, designs: { mode: "ALL", ids: [] }, services: { mode: "ALL", ids: [] } }, designs, services);
    // The unpriced design never counts; a fixed ¥5,500 lowers D1 and D2 but neither service.
    expect(counts({ type: "FIXED", value: 5500 })).toEqual({ designs: 2, services: 0 });
    expect(counts({ type: "PERCENT", value: 10 })).toEqual({ designs: 2, services: 2 });
    expect(
      saleLoweredCounts(
        { rule: { type: "PERCENT", value: 10 }, designs: { mode: "TIERS", ids: ["t1"] }, services: { mode: "NONE", ids: [] } },
        designs,
        services,
      ),
    ).toEqual({ designs: 1, services: 0 });
  });
});

describe("saleOptionsStatus", () => {
  it("is loading while any read loads, failed when one failed, else ready", () => {
    expect(saleOptionsStatus({ isLoading: true }, { isLoading: false, error: new Error("x") })).toBe("loading");
    expect(saleOptionsStatus({ isLoading: false }, { isLoading: false, error: new Error("x") })).toBe("failed");
    expect(saleOptionsStatus({ isLoading: false, error: undefined }, { isLoading: false })).toBe("ready");
  });
});

describe("salesOnTier", () => {
  it("counts the sales that pick designs by that tier", () => {
    const sales: Array<Pick<AdminSale, "designs">> = [
      { designs: { mode: "TIERS", ids: ["t1", "t2"] } },
      { designs: { mode: "TIERS", ids: ["t2"] } },
      { designs: { mode: "ITEMS", ids: ["t1"] } },
      { designs: { mode: "ALL", ids: [] } },
    ];
    expect(salesOnTier(sales, "t1")).toBe(1);
    expect(salesOnTier(sales, "t2")).toBe(2);
    expect(salesOnTier(sales, "t3")).toBe(0);
  });
});

describe("filterSaleTargets", () => {
  const items = [
    { id: "a", groupId: null, name: "Sơn gel tay", price: 5000 },
    { id: "b", groupId: null, name: "Nail đính đá", price: 7000 },
  ];

  it("keeps every item for an empty query", () => {
    expect(filterSaleTargets(items, "  ").map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("matches without case or accents", () => {
    expect(filterSaleTargets(items, "SON GEL").map((item) => item.id)).toEqual(["a"]);
    expect(filterSaleTargets(items, "dinh").map((item) => item.id)).toEqual(["b"]);
  });
});

describe("saleFormScopes", () => {
  it("returns the API scopes even while the rule is not filled in", () => {
    const form = { ...newSaleForm(FRIDAY, { designs: ["d1"], services: [] }), ruleValue: "" };
    expect(saleFormScopes(form)).toEqual({
      designs: { mode: "ITEMS", ids: ["d1"] },
      services: { mode: "NONE", ids: [] },
    });
  });
});

describe("designTarget and serviceTarget", () => {
  it("reads a design's tier, price and cover", () => {
    expect(
      designTarget({ id: "d1", title: "Hoa", status: "PUBLISHED", version: 1, priceTierId: "t1", indicativePrice: 6600, images: ["https://img/1.jpg"] }),
    ).toEqual({ id: "d1", groupId: "t1", name: "Hoa", price: 6600, imageUrl: "https://img/1.jpg" });
    expect(designTarget({ id: "d2", title: "Trơn", status: "DRAFT", version: 1 })).toEqual({
      id: "d2",
      groupId: null,
      name: "Trơn",
      price: null,
      imageUrl: null,
    });
  });

  it("reads a service's public category key and price", () => {
    expect(
      serviceTarget({ id: "s1", name: "Gel", price: 5000, durationMinutes: 60, active: true, version: 1, categoryId: "gel", imageUrl: null }),
    ).toEqual({ id: "s1", groupId: "gel", name: "Gel", price: 5000, imageUrl: null });
  });
});
