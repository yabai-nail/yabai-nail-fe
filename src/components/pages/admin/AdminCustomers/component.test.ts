import { describe, expect, it } from "vitest";

import type { AdminCustomer } from "@/service";

import { toCustomerRow } from "./component";
import { customerRankLabel, customerSegmentFilter, type Customer } from "./data";

const listCustomer: Customer = {
  id: "customer-1",
  name: "Tên cũ",
  initials: "TC",
  phone: "0901234567",
  birthday: "",
  handle: "",
  preference: "",
  lastVisit: "",
  totalSpend: 0,
  points: 0,
  visits: 0,
  segment: "new",
  rank: "none",
  note: "",
  version: 1,
  locale: "vi",
  status: "ACTIVE",
};

describe("toCustomerRow", () => {
  it("preserves member, platinum and configured tiers without changing the server segment", () => {
    for (const tier of ["MEMBER", "PLATINUM", "VIP_CUSTOM"]) {
      const row = toCustomerRow({ id: "c", displayName: "Customer", version: 1, membershipTier: tier, segment: "NEW", visitCount: 0 } as AdminCustomer, "Unnamed", { ...listCustomer, rank: "gold" });
      expect(row).toMatchObject({ rank: tier.toLowerCase(), segment: "new", visits: 0 });
      expect(customerRankLabel(row.rank, key => key)).toBe(tier === "VIP_CUSTOM" ? tier : `rank.${tier.toLowerCase()}`);
    }
    expect(customerSegmentFilter("regular")).toBe("RETURNING");
    expect(customerSegmentFilter("loyal")).toBe("LOYAL");
    expect(customerSegmentFilter("new")).toBe("NEW");
    expect(customerSegmentFilter("all")).toBeUndefined();
  });
  it("keeps list-only CRM summaries when the detail endpoint returns account fields only", () => {
    const detail: AdminCustomer = {
      id: "customer-1",
      displayName: "Tên mới",
      phone: "0901234567",
      locale: "vi",
      status: "ACTIVE",
      version: 2,
    };

    expect(toCustomerRow(detail, "Chưa đặt tên", listCustomer)).toMatchObject({
      name: "Tên mới",
      segment: "new",
      visits: 0,
      totalSpend: 0,
      version: 2,
    });
  });
});
