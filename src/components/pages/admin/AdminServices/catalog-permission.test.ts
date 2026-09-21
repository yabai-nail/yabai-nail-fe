import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("chain catalogue permission", () => {
  it("does not render global service CRUD for branch-only managers", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "pages", "admin", "AdminServices", "component.tsx"), "utf8");

    expect(source).toContain('const canWrite = useAdminPermission("catalog.write.all")');
    expect(source).not.toContain('useAdminPermission("catalog.write.branch", "catalog.write.all")');
  });
});
