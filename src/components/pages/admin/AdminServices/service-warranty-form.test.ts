import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "src", "components", "pages", "admin", "AdminServices");

describe("service warranty controls", () => {
  it("loads, validates and submits warranty days in create and edit", () => {
    const create = readFileSync(join(directory, "ServiceCreateModal.tsx"), "utf8");
    const edit = readFileSync(join(directory, "ServiceEditModal.tsx"), "utf8");

    expect(create).toContain("warrantyDays: warrantyDaysNum");
    expect(create).toContain('t("form.warrantyDays")');
    expect(edit).toContain("String(service.warrantyDays ?? 0)");
    expect(edit).toContain("warrantyDays: warrantyDaysNum");
  });
});
