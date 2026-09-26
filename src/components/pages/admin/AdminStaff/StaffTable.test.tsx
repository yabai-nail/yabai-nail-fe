import { NextIntlClientProvider } from "next-intl";
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
  avatarUrl: null,
  status: "working" as const,
  revenue: 10_000,
  refundTotal: 0,
  commissionRate: 10,
  commissionAmount: 1_000,
  orders: 2,
  version: 1,
  branchId: "branch-1",
  branchName: "YABAI NAIL Thao Dien",
};

function render(staff: ReadonlyArray<StaffMember>, canWrite = true) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <StaffTable
        staff={staff}
        selectedId={member.id}
        onSelect={() => {}}
        canWrite={canWrite}
        busyId={null}
        onEdit={() => {}}
        onToggleActive={() => {}}
      />
    </NextIntlClientProvider>,
  );
}

describe("StaffTable", () => {
  it("offers edit and deactivate actions to an admin who can write", () => {
    const markup = render([member]);

    expect(markup).toContain(messages.admin.staff.editAction);
    expect(markup).toContain(messages.admin.staff.actionDeactivate);
  });

  it("hides row actions from a read-only admin", () => {
    const markup = render([member], false);

    expect(markup).not.toContain(messages.admin.staff.actionDeactivate);
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
