import { describe, expect, it } from "vitest";

import type { AdminCustomer } from "@/service";

import { toCustomerRow } from "./component";
import type { Customer } from "./data";

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
