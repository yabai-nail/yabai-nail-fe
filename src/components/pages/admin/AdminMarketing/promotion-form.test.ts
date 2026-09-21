import { describe, expect, it } from "vitest";

import { parsePromotionInteger, validatePromotionForm, type PromotionFormValues } from "./promotion-form";

const valid: PromotionFormValues = {
  code: "WELCOME_20",
  title: "Welcome 20%",
  type: "PERCENT",
  value: "20",
  startAt: "2026-09-22",
  endAt: "2026-10-22",
  issuanceLimit: "1,000",
};

describe("promotion form contract", () => {
  it("parses grouped integers without changing invalid values", () => {
    expect(parsePromotionInteger("10,000")).toBe(10_000);
    expect(parsePromotionInteger("１０")).toBeNull();
    expect(parsePromotionInteger("10.5")).toBeNull();
    expect(parsePromotionInteger("-10")).toBeNull();
    expect(parsePromotionInteger("¥1000")).toBeNull();
  });

  it("accepts a complete create payload", () => {
    expect(validatePromotionForm(valid, { isEdit: false, termsLocked: false })).toBeNull();
  });

  it.each([
    [{ title: "x" }, "title"],
    [{ code: "a!" }, "code"],
    [{ value: "10.5" }, "value"],
    [{ value: "101" }, "percentage"],
    [{ issuanceLimit: "0" }, "issuanceLimit"],
    [{ startAt: "" }, "dates"],
    [{ endAt: "2026-09-22" }, "dateOrder"],
  ] as const)("returns a stable error for %o", (patch, error) => {
    expect(validatePromotionForm({ ...valid, ...patch }, { isEdit: false, termsLocked: false })).toBe(error);
  });

  it("only requires an editable title after commercial terms are active", () => {
    expect(validatePromotionForm(
      { ...valid, code: "", value: "", startAt: "", endAt: "", issuanceLimit: "" },
      { isEdit: true, termsLocked: true },
    )).toBeNull();
  });
});
