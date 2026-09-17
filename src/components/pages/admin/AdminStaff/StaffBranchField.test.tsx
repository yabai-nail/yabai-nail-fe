import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StaffBranchField, type StaffBranchOption } from "./StaffBranchField";

const branches: ReadonlyArray<StaffBranchOption> = [
  { id: "branch-1", name: "YABAI NAIL Thao Dien" },
  { id: "branch-2", name: "YABAI NAIL Tenjin" },
];

function render(options: ReadonlyArray<StaffBranchOption>, value: string) {
  return renderToStaticMarkup(
    <StaffBranchField
      branches={options}
      hint="Chuyển nhân viên sang chi nhánh khác."
      label="Chi nhánh"
      onChange={() => {}}
      value={value}
    />,
  );
}

describe("StaffBranchField", () => {
  it("offers every branch and starts on the one it was given", () => {
    const markup = render(branches, "branch-2");

    expect(markup).toContain("Chi nhánh");
    expect(markup).toContain("YABAI NAIL Thao Dien");
    expect(markup).toContain("YABAI NAIL Tenjin");
    expect(markup).toMatch(/<option[^>]*value="branch-2"[^>]*selected/);
  });

  // A single-branch salon has nothing to choose between, and a select with one option reads as
  // a control that is broken rather than as one that is unnecessary.
  it("renders nothing when there is nothing to choose between", () => {
    expect(render([branches[0]], "branch-1")).toBe("");
    expect(render([], "branch-1")).toBe("");
  });

  // The branch list comes back empty or partial for an admin whose token cannot read every
  // branch. Preselecting the first option there would file the technician at the wrong salon.
  it("renders nothing when the current branch is not among the options", () => {
    expect(render(branches, "branch-elsewhere")).toBe("");
  });
});
