import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const directory = join(root, "src", "components", "pages", "admin", "AdminBranches");

describe("admin branch deletion and photo", () => {
  it("offers a delete action with a confirmation dialog", () => {
    const screen = readFileSync(join(directory, "component.tsx"), "utf8");
    const dialog = readFileSync(join(directory, "BranchDeleteModal.tsx"), "utf8");

    expect(screen).toContain("TrashIcon");
    expect(screen).toContain("<BranchDeleteModal");
    expect(dialog).toContain("adminService.deleteBranch(branch.id, branch.version)");
    expect(dialog).toContain('t("confirm",');
    expect(dialog).toContain('"BRANCH_HAS_ACTIVE_STAFF"');
  });

  it("uploads the photo on save and sends it as imageMediaId", () => {
    const modal = readFileSync(join(directory, "BranchModal.tsx"), "utf8");

    expect(modal).toContain("<BranchImageField");
    expect(modal).toContain("imageMediaId: resolved.patch.avatarMediaId");
    expect(modal).toContain("adminMediaService.deleteMedia(uploadedMediaId)");
  });

  it("keeps the added branch copy in every locale catalogue", () => {
    for (const locale of ["vi", "ja", "en"]) {
      const messages = JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
      const branches = messages.admin.branches;

      expect(branches.delete).toBeTruthy();
      expect(branches.columns.photo).toBeTruthy();
      expect(branches.deleteDialog.confirm).toBeTruthy();
      expect(branches.deleteDialog.activeStaff).toBeTruthy();
      expect(branches.image.title).toBeTruthy();
      expect(Object.keys(branches.image.errors).sort()).toEqual(["empty", "tooLarge", "unsupportedType"]);
    }
  });
});
