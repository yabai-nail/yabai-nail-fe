import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import { StaffBranchField, type StaffBranchOption } from "./StaffBranchField";

const branches: ReadonlyArray<StaffBranchOption> = [
  { id: "branch-1", name: "YABAI NAIL Thao Dien" },
  { id: "branch-2", name: "YABAI NAIL Tenjin" },
];

function render(options: ReadonlyArray<StaffBranchOption>, value: string) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <StaffBranchField branches={options} onChange={() => {}} value={value} />
    </NextIntlClientProvider>,
  );
}

describe("StaffBranchField", () => {
  it("offers every branch and starts on the one the member works at", () => {
    const markup = render(branches, "branch-2");

    expect(markup).toContain(messages.admin.staff.edit.branch);
    expect(markup).toContain("YABAI NAIL Thao Dien");
    expect(markup).toContain("YABAI NAIL Tenjin");
    expect(markup).toMatch(/<option[^>]*value="branch-2"[^>]*selected/);
  });

  // A single-branch salon has no transfer to offer, and a select with one option reads as a
  // control that is broken rather than as one that is unnecessary.
  it("renders nothing when there is nowhere to move to", () => {
    expect(render([branches[0]], "branch-1")).toBe("");
    expect(render([], "branch-1")).toBe("");
  });

  // The branch list comes back empty or partial for an admin whose token cannot read every
  // branch. Preselecting the first option there would move the technician on the next save.
  it("renders nothing when the member's own branch is not among the options", () => {
    expect(render(branches, "branch-elsewhere")).toBe("");
  });
});
