import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const directory = join(root, "src", "components", "pages", "admin", "AdminServices");

describe("admin service category deletion", () => {
  it("uses a confirmation dialog and refuses a non-empty category", () => {
    const table = readFileSync(join(directory, "CategoryTable.tsx"), "utf8");
    const dialog = readFileSync(join(directory, "CategoryDeleteModal.tsx"), "utf8");

    expect(table).toContain("<CategoryDeleteModal");
    expect(dialog).toContain("serviceCount > 0");
    expect(dialog).toContain("adminService.deleteServiceCategory(category.id, category.version)");
    expect(dialog).toContain('t("hasServices", { count: serviceCount })');
  });

  it("has matching delete copy in all locales", () => {
    for (const locale of ["vi", "ja", "en"]) {
      const messages = JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
      expect(messages.admin.services.categoryTable.deleteLabel).toContain("{name}");
      expect(messages.admin.services.categoryDelete.hasServices).toContain("{count}");
    }
  });
});
