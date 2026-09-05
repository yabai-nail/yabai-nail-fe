import { NextIntlClientProvider } from "next-intl";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import type { StaffMember } from "./data";
import { StaffTable } from "./StaffTable";

const member: StaffMember = {
  id: "staff-1",
  name: "Yuki",
  initials: "YU",
  phone: "0900000001",
  status: "working" as const,
  revenue: 10_000,
  commissionRate: 10,
  commissionAmount: 1_000,
  orders: 2,
  version: 1,
  branchId: "branch-1",
  branchName: "YABAI NAIL Thao Dien",
};

function render(staff: ReadonlyArray<StaffMember>) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <StaffTable staff={staff} selectedId={member.id} onSelect={() => {}} />
    </NextIntlClientProvider>,
  );
}

describe("StaffTable", () => {
  it("keeps edit actions out of the roster so editing starts from the detail panel", () => {
    const LegacyCompatibleStaffTable = StaffTable as ComponentType<Record<string, unknown>>;
    // The table reads its words from the catalogue now, so it needs the provider the
    // console gives it; Vietnamese keeps the assertion below readable.
    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale="vi" messages={messages}>
        <LegacyCompatibleStaffTable
          staff={[member]}
          selectedId={member.id}
          onSelect={() => {}}
          onEdit={() => {}}
        />
      </NextIntlClientProvider>,
    );

    expect(markup).not.toContain("Sửa thông tin");
  });

  // The roster is org-level while everything else on the screen is branch-scoped,
  // so without this column an owner cannot tell which salon a technician works at.
  it("names the branch each member works at", () => {
    const markup = render([member]);

    expect(markup).toContain(messages.admin.staff.table.branch);
    expect(markup).toContain("YABAI NAIL Thao Dien");
  });

  it("shows a dash, not a blank cell, when the branch name is unknown", () => {
    const markup = render([{ ...member, branchName: null }]);

    expect(markup).not.toContain("YABAI NAIL Thao Dien");
    expect(markup).toMatch(/<td[^>]*>—<\/td>/);
  });
});
