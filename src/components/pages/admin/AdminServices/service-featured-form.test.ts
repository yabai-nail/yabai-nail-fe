import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "src", "components", "pages", "admin", "AdminServices");

describe("service featured controls", () => {
  it("uses the same roomy responsive layout for create and edit", () => {
    for (const file of ["ServiceCreateModal.tsx", "ServiceEditModal.tsx"]) {
      const source = readFileSync(join(directory, file), "utf8");

      expect(source).toContain('<Modal.Container size="lg"');
      expect(source).toContain("<ServiceVisibilityFields");
      expect(source).toContain('className="grid gap-4 sm:grid-cols-2"');
    }

    const settings = readFileSync(join(directory, "ServiceVisibilityFields.tsx"), "utf8");
    expect(settings).toContain('useTranslations("admin.services")');
    expect(settings).toContain('className="grid gap-3 sm:grid-cols-2"');
    expect(settings).toContain('t("visibility.heading")');
    expect(settings).toContain('t("visibility.featuredLabel")');
  });

  it("lets admin select the mobile featured service while creating", () => {
    const source = readFileSync(join(directory, "ServiceCreateModal.tsx"), "utf8");

    expect(source).toContain("const [isFeatured, setIsFeatured]");
    expect(source).toMatch(/createService\(\{[\s\S]*isFeatured,/);
    expect(source).toContain("<ServiceVisibilityFields");
  });

  it("loads and saves the featured selection while editing", () => {
    const source = readFileSync(join(directory, "ServiceEditModal.tsx"), "utf8");

    expect(source).toContain("useState(Boolean(service.isFeatured))");
    expect(source).toMatch(/updateService\([\s\S]*isFeatured,/);
    expect(source).toContain("<ServiceVisibilityFields");
    expect(source).toContain("useState(service.isVisible)");
    expect(source).toMatch(/updateService\([\s\S]*status: isVisible \? "ACTIVE" : "INACTIVE"/);
  });
});
