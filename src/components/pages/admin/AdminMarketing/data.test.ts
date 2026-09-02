import { describe, expect, it } from "vitest";
import {
  campaignCanCancel,
  campaignStatusLabel,
  adaptPromotion,
  filterPromotions,
  formatDiscount,
  paginate,
  promotionFixtures,
  promotionStatuses,
} from "./data";
import type { Translator } from "@/i18n/config";

/** Echoes the key it was handed; only the codes the catalogue names answer has(). */
const KNOWN = new Set(["SCHEDULED", "DISPATCHING", "COMPLETED", "CANCELLED"].map((c) => `campaignStatus.${c}`));
const t = Object.assign((key: string) => key, { has: (key: string) => KNOWN.has(key) }) as unknown as Translator;

describe("campaignStatusLabel", () => {
  it.each([
    ["SCHEDULED", "campaignStatus.SCHEDULED"],
    ["DISPATCHING", "campaignStatus.DISPATCHING"],
    ["COMPLETED", "campaignStatus.COMPLETED"],
    ["CANCELLED", "campaignStatus.CANCELLED"],
  // The adapter reaches for a key; what the key says is the catalogue's business.
  ])("looks up %s", (status, expected) => {
    expect(campaignStatusLabel(status, t)).toBe(expected);
  });

  it("does not expose an unknown backend code", () => {
    expect(campaignStatusLabel("NEW_SERVER_STATE", t)).toBe("campaignStatus.unknown");
  });

  it("offers cancellation only before dispatch starts", () => {
    expect(campaignCanCancel("SCHEDULED")).toBe(true);
    expect(campaignCanCancel("DISPATCHING")).toBe(false);
    expect(campaignCanCancel("COMPLETED")).toBe(false);
  });
});

describe("marketing promotion derivation", () => {
  it("filters by status and query on code/name", () => {
    expect(filterPromotions(promotionFixtures, "ACTIVE", "").map((p) => p.id)).toEqual(["pr1", "pr2"]);
    expect(filterPromotions(promotionFixtures, "all", "vip").map((p) => p.id)).toEqual(["pr3"]);
  });

  it("lists distinct statuses sorted", () => {
    expect(promotionStatuses(promotionFixtures)).toEqual(["ACTIVE", "EXPIRED", "SCHEDULED"]);
  });

  it("formats percentage and fixed discounts, dash otherwise", () => {
    expect(formatDiscount({ type: "PERCENT", value: 20 })).toBe("20%");
    expect(formatDiscount({ type: "FIXED", value: 50000 })).toBe("50.000 ¥");
    expect(formatDiscount({ type: "FIXED", value: undefined as unknown as number })).toBe("—");
  });

  it("adapts a backend promotion", () => {
    const row = adaptPromotion({
      id: "p1", code: "X", title: "Test", type: "FIXED", status: "ACTIVE", value: 10000, version: 4,
    });
    expect(row).toMatchObject({ id: "p1", code: "X", title: "Test", type: "FIXED", value: 10000, version: 4 });
  });

  it("paginates and rejects invalid page size", () => {
    expect(paginate(promotionFixtures, 2, 2).page).toBe(2);
    expect(() => paginate(promotionFixtures, 1, -1)).toThrow(RangeError);
  });
});
