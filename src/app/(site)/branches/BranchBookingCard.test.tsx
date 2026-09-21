import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Branch } from "@/service";

import { BranchBookingCard } from "./BranchBookingCard";

const branch: Branch = {
  id: "branch-tenjin",
  name: "YABAI Nail Tenjin",
  address: "1-2-3 Tenjin, Fukuoka",
  timezone: "Asia/Tokyo",
  active: true,
  version: 1,
  createdAt: "2026-09-22T00:00:00.000Z",
  updatedAt: "2026-09-22T00:00:00.000Z",
};

describe("BranchBookingCard", () => {
  it("renders the whole branch card as an accessible service-selection link", () => {
    const markup = renderToStaticMarkup(<BranchBookingCard branch={branch} />);

    expect(markup).toContain('<a aria-label="Chọn dịch vụ tại YABAI Nail Tenjin"');
    expect(markup).toContain('href="/booking/services?branchId=branch-tenjin"');
    expect(markup).toContain("YABAI Nail Tenjin");
    expect(markup).toContain("1-2-3 Tenjin, Fukuoka");
    expect(markup).toContain("Chọn dịch vụ");
  });
});
