import { describe, expect, it } from "vitest";

import { isAdminPhone, isStrongTemporaryPassword } from "./admin-credentials";

describe("isAdminPhone", () => {
  it("accepts a ten-digit number starting with zero, trimmed", () => {
    expect(isAdminPhone("0900000010")).toBe(true);
    expect(isAdminPhone("  0900000010  ")).toBe(true);
  });

  // The backend's CUSTOMER_PHONE_PATTERN: Japanese mobiles are eleven digits, and both
  // countries' international forms are accepted. Refusing them here left the staff form's
  // submit disabled for a number the API would have taken.
  it("accepts the Japanese and international forms the backend takes", () => {
    expect(isAdminPhone("09012345678")).toBe(true);
    expect(isAdminPhone("+84901234567")).toBe(true);
    expect(isAdminPhone("+819012345678")).toBe(true);
  });

  it("rejects anything the backend would refuse", () => {
    expect(isAdminPhone("900000010")).toBe(false);
    expect(isAdminPhone("090000000101")).toBe(false);
    expect(isAdminPhone("090000001a")).toBe(false);
    expect(isAdminPhone("090-1234-5678")).toBe(false);
    expect(isAdminPhone("+8490123456")).toBe(false);
    expect(isAdminPhone("")).toBe(false);
  });
});

describe("isStrongTemporaryPassword", () => {
  // The two cases the backend's own spec pins down, so a change on either side shows up here.
  it("wants length, both cases and a digit", () => {
    expect(isStrongTemporaryPassword("NewPass1")).toBe(true);
    expect(isStrongTemporaryPassword("newpassword1")).toBe(false);
    expect(isStrongTemporaryPassword("NEWPASSWORD1")).toBe(false);
    expect(isStrongTemporaryPassword("NewPassword")).toBe(false);
    expect(isStrongTemporaryPassword("NewPas1")).toBe(false);
  });

  it("stops at the backend's upper bound", () => {
    expect(isStrongTemporaryPassword(`Aa1${"x".repeat(125)}`)).toBe(true);
    expect(isStrongTemporaryPassword(`Aa1${"x".repeat(126)}`)).toBe(false);
  });
});
