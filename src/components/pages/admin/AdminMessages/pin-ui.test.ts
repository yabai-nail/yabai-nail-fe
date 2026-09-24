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
    // The toggle sits in a reserved gutter, vertically centred, off the time label.
    expect(list).toMatch(/pr-11/);
    expect(list).toMatch(/top-1\/2 -translate-y-1\/2/);
  });

  it("puts the toggle in the thread header and routes errors without a second toast", () => {
    expect(read("MessageThread.tsx")).toMatch(/onTogglePin \?/);
    const page = read("component.tsx");
    expect(page).toMatch(/adminService\.(pinConversation|unpinConversation)/);
    expect(page).toMatch(/isPinLimitError\(thrown\) \? t\("pinLimit"\)/);
    const toggle = page.slice(page.indexOf("async function togglePin"));
    const toggleBody = toggle.slice(0, toggle.indexOf("\n  }\n"));
    expect(toggleBody).not.toMatch(/notifyError|notifySuccess/);
    // A failure on a non-selected row must not surface under the open thread.
    expect(toggleBody).toMatch(/conversation\.id === selected\?\.id/);
  });
});
