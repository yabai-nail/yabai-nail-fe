import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin customer account creation", () => {
  it("collects registration credentials and uses the branch customer endpoint", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "pages", "admin", "AdminAccounts", "AccountModal.tsx"), "utf8");

    expect(source).toContain('"CUSTOMER"');
    expect(source).toContain("adminService.createCustomer");
    expect(source).toContain("temporaryPassword");
    expect(source).toContain("username");
    expect(source).toContain("email");
  });
});
