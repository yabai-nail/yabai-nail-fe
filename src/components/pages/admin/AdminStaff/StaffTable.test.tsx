import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StaffTable } from "./StaffTable";

const member = {
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
};

describe("StaffTable", () => {
  it("keeps edit actions out of the roster so editing starts from the detail panel", () => {
    const LegacyCompatibleStaffTable = StaffTable as ComponentType<Record<string, unknown>>;
    const markup = renderToStaticMarkup(
      createElement(LegacyCompatibleStaffTable, {
        staff: [member],
        selectedId: member.id,
        onSelect: () => {},
        onEdit: () => {},
      }),
    );

    expect(markup).not.toContain("Sửa thông tin");
  });
});
