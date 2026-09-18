import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const directory = join(root, "src", "components", "pages", "admin", "AdminNailDesigns");

describe("admin nail design deletion", () => {
  it("offers a translated delete action and confirmation dialog", () => {
    const screen = readFileSync(join(directory, "component.tsx"), "utf8");
    const dialog = readFileSync(join(directory, "DesignDeleteModal.tsx"), "utf8");

    expect(screen).toContain("TrashIcon");
    expect(screen).toContain('t("deleteDesign"');
    expect(screen).toContain("<DesignDeleteModal");
    expect(dialog).toContain("adminService.deleteNailDesign(design.id, design.version)");
    expect(dialog).toContain('t("delete.confirm",');
  });

  it("keeps the delete copy in every locale catalogue", () => {
    for (const locale of ["vi", "ja", "en"]) {
      const messages = JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
      const designs = messages.admin.nailDesigns;

      expect(designs.deleteDesign).toContain("{name}");
      expect(designs.delete.confirm).toContain("{name}");
      for (const key of ["title", "hint", "cancel", "action", "deleting", "success", "failed", "failedWithDetails"]) {
        expect(designs.delete[key]).toBeTruthy();
      }
    }
  });
});
