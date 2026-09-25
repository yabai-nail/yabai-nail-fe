import { describe, expect, it } from "vitest";

import type { Translator } from "@/i18n/config";
import type { AdminCustomer } from "@/service";
import { resolveCustomer } from "./component";

const t = ((key: string) => key) as Translator;

describe("appointment customer adapter", () => {
  it.each([["NEW", "new"], ["LOYAL", "loyal"], ["RETURNING", "regular"]])("preserves server segment %s regardless of visit count", (segment, expected) => {
    const customer: AdminCustomer = { id: "customer-segment", displayName: "Ami", segment, visitCount: 0, version: 1 };
    expect(resolveCustomer(customer.id, new Map([[customer.id, customer]]), t).segment).toBe(expected);
  });
  it("maps the CRM summary fields returned by the customer list", () => {
    const customer: AdminCustomer = {
      id: "customer-1",
      displayName: "Hana",
      phone: "0900000000",
      birthday: "1990-01-02",
      visitCount: 7,
      totalSpend: 45000,
      preferenceSummary: "Móng ngắn, màu nude",
      version: 1,
    };

    expect(resolveCustomer(customer.id, new Map([[customer.id, customer]]), t)).toMatchObject({
      birthday: "1990-01-02",
      visits: 7,
      totalSpend: 45000,
      preference: "Móng ngắn, màu nude",
    });
  });

  it("keeps empty CRM summaries safe", () => {
    const customer: AdminCustomer = { id: "customer-2", displayName: "Ami", version: 1 };

    expect(resolveCustomer(customer.id, new Map([[customer.id, customer]]), t)).toMatchObject({
      birthday: "",
      visits: 0,
      totalSpend: 0,
      preference: "",
    });
  });
});
