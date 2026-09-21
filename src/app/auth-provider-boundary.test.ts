import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appDirectory = join(process.cwd(), "src", "app");

describe("admin auth provider boundary", () => {
  it("only mounts admin session refreshes inside the admin route tree", () => {
    const rootProviders = readFileSync(join(appDirectory, "providers.tsx"), "utf8");
    const adminLayout = readFileSync(
      join(appDirectory, "(admin)", "admin", "layout.tsx"),
      "utf8",
    );

    expect(rootProviders).not.toContain("AuthProvider");
    expect(adminLayout).toContain("AuthProvider");
    expect(adminLayout).toContain("<AuthProvider>");
    expect(adminLayout).toContain("</AuthProvider>");
  });
});
