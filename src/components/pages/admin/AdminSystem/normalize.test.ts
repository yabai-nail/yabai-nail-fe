import { describe, expect, it } from "vitest";

import {
  accountStatusLabel,
  formatDateTime,
  isValidPhone,
  normalizePhone,
  parseConfigObject,
  roleLabel,
  stringifyConfig,
  validateAccount,
} from "./normalize";

describe("normalizePhone / isValidPhone", () => {
  it("strips spaces before validating", () => {
    expect(normalizePhone("090 000 0002")).toBe("0900000002");
    expect(isValidPhone("090 000 0002")).toBe(true);
  });

  it("accepts a 10-digit number starting with 0", () => {
    expect(isValidPhone("0901234567")).toBe(true);
  });

  it("rejects wrong length or leading digit", () => {
    expect(isValidPhone("1901234567")).toBe(false);
    expect(isValidPhone("090123456")).toBe(false);
    expect(isValidPhone("09012345678")).toBe(false);
    expect(isValidPhone("abcdefghij")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});

describe("validateAccount", () => {
  const base = { phone: "0901234567", displayName: "Nguyen A", role: "MANAGER", branchIds: ["b1"] };

  it("passes a complete manager draft", () => {
    expect(validateAccount(base, { phoneRequired: true }).ok).toBe(true);
  });

  it("requires phone on create but not on edit", () => {
    const draft = { ...base, phone: "" };
    expect(validateAccount(draft, { phoneRequired: true }).errors.phone).toBeDefined();
    expect(validateAccount(draft, { phoneRequired: false }).errors.phone).toBeUndefined();
  });

  it("flags an invalid phone on create", () => {
    expect(validateAccount({ ...base, phone: "123" }, { phoneRequired: true }).errors.phone).toBeDefined();
  });

  it("requires a display name of at least two characters", () => {
    expect(validateAccount({ ...base, displayName: "A" }, { phoneRequired: true }).errors.displayName).toBeDefined();
  });

  it("rejects an unknown role", () => {
    expect(validateAccount({ ...base, role: "ROBOT" }, { phoneRequired: true }).errors.role).toBeDefined();
  });

  it("requires a branch for a non-owner role", () => {
    expect(validateAccount({ ...base, branchIds: [] }, { phoneRequired: true }).errors.branchIds).toBeDefined();
  });

  it("allows an owner without any branch", () => {
    const owner = { ...base, role: "OWNER", branchIds: [] };
    expect(validateAccount(owner, { phoneRequired: true }).ok).toBe(true);
  });
});

describe("labels", () => {
  it("maps known roles and falls back to the raw value", () => {
    expect(roleLabel("OWNER")).toBe("Chủ chuỗi");
    expect(roleLabel("MANAGER")).toBe("Quản lý");
    expect(roleLabel("MYSTERY")).toBe("MYSTERY");
  });

  it("maps account statuses", () => {
    expect(accountStatusLabel("ACTIVE")).toBe("Đang hoạt động");
    expect(accountStatusLabel("weird")).toBe("weird");
  });
});

describe("parseConfigObject", () => {
  it("parses an object", () => {
    expect(parseConfigObject('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
  });

  it("treats empty text as an empty object", () => {
    expect(parseConfigObject("   ")).toEqual({ ok: true, value: {} });
  });

  it("rejects malformed json", () => {
    expect(parseConfigObject("{bad}").ok).toBe(false);
  });

  it("rejects a non-object json value", () => {
    expect(parseConfigObject("[1,2]").ok).toBe(false);
    expect(parseConfigObject("42").ok).toBe(false);
  });
});

describe("stringifyConfig", () => {
  it("drops the version field and pretty-prints the rest", () => {
    const text = stringifyConfig({ version: 3, features: { a: true } });
    expect(text).not.toContain("version");
    expect(JSON.parse(text)).toEqual({ features: { a: true } });
  });

  it("returns an empty object literal for undefined", () => {
    expect(stringifyConfig(undefined)).toBe("{}");
  });
});

describe("formatDateTime", () => {
  it("returns a dash for empty or invalid input", () => {
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("")).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
  });

  it("formats a valid ISO string", () => {
    expect(formatDateTime("2026-08-24T18:08:34.282Z")).not.toBe("—");
  });
});
