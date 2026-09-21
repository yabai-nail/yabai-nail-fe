import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "src", "components", "pages", "admin", "AdminServices");

describe("service create/edit form contract", () => {
  it("keeps the add-on name editable and maps the explicit no-selection flag in both forms", () => {
    const create = readFileSync(join(directory, "ServiceCreateModal.tsx"), "utf8");
    const edit = readFileSync(join(directory, "ServiceEditModal.tsx"), "utf8");

    for (const form of [create, edit]) {
      expect(form).toContain('representsNoSelection: serviceType === "ADD_ON" && representsNoSelection');
      expect(form).toContain('t("create.name")');
      expect(form).toContain('min={serviceType === "ADD_ON" ? 0 : 1}');
    }
    expect(edit).toContain('serviceType === "BASE" ? <label');
  });
});
