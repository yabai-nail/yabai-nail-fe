import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const directory = join(root, "src", "components", "pages", "admin", "AdminServices");

describe("admin service deletion", () => {
  it("offers a translated delete action and confirmation dialog", () => {
    // The row actions are shared by the services and add-ons tables, and each table renders them.
    const actions = readFileSync(join(directory, "ServiceTableCells.tsx"), "utf8");
    const table = readFileSync(join(directory, "ServiceTable.tsx"), "utf8");
    const screen = readFileSync(join(directory, "component.tsx"), "utf8");
    const dialog = readFileSync(join(directory, "ServiceDeleteModal.tsx"), "utf8");

    expect(actions).toContain("TrashIcon");
    expect(actions).toContain('t("table.deleteService"');
    expect(table).toContain("<ServiceRowActions");
    expect(screen).toContain("<ServiceDeleteModal");
    expect(dialog).toContain("adminService.deleteService(service.id, service.version)");
    expect(dialog).toContain('t("delete.confirm",');
  });

  it("keeps the added service copy in every locale catalogue", () => {
    for (const locale of ["vi", "ja", "en"]) {
      const messages = JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
      const services = messages.admin.services;

      expect(services.visibility.featuredLabel).toBeTruthy();
      expect(services.table.deleteService).toBeTruthy();
      expect(services.delete.confirm).toBeTruthy();
      expect(services.image.optional).toBeTruthy();
    }
  });
});
