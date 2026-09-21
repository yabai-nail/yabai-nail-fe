import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const directory = join(root, "src", "components", "pages", "admin", "AdminNailDesigns");

describe("admin nail design price CRUD", () => {
  it("loads, submits and lists indicativePrice", () => {
    const modal = readFileSync(join(directory, "DesignModal.tsx"), "utf8");
    const screen = readFileSync(join(directory, "component.tsx"), "utf8");

    expect(modal).toContain("design?.indicativePrice");
    expect(modal).toContain("indicativePrice: parsedPrice!");
    expect(screen).toContain("row.indicativePrice === null");
    expect(screen).toContain('t("columns.price")');
  });

  it("has price labels in every locale", () => {
    for (const locale of ["vi", "ja", "en"]) {
      const messages = JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
      expect(messages.admin.nailDesigns.columns.price).toBeTruthy();
      expect(messages.admin.nailDesigns.modal.indicativePrice).toContain("¥");
      expect(messages.admin.nailDesigns.priceMissing).toBeTruthy();
    }
  });
});
