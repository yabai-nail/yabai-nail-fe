import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(process.cwd(), "src", "components", "pages", "admin", "AdminMessages");
const read = (name: string) => readFileSync(join(dir, name), "utf8");

describe("conversation pin UI", () => {
  it("marks pinned rows, separates the groups and offers a pin toggle per row", () => {
    const list = read("ConversationList.tsx");
    expect(list).toMatch(/pinnedBoundaryIndex\(conversations\)/);
    expect(list).toMatch(/t\("pinnedSection"\)/);
    expect(list).toMatch(/onTogglePin\(conversation\)/);
    // A button inside the row button would be invalid HTML: the toggle is a sibling.
    expect(list).toMatch(/className="group relative"/);
  });

  it("puts the toggle in the thread header and routes errors without a second toast", () => {
    expect(read("MessageThread.tsx")).toMatch(/onTogglePin \?/);
    const page = read("component.tsx");
    expect(page).toMatch(/adminService\.(pinConversation|unpinConversation)/);
    expect(page).toMatch(/isPinLimitError\(thrown\) \? t\("pinLimit"\)/);
    const toggle = page.slice(page.indexOf("async function togglePin"));
    expect(toggle.slice(0, toggle.indexOf("\n  }\n"))).not.toMatch(/notifyError|notifySuccess/);
  });
});
