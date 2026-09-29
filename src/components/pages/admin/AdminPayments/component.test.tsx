import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import type { Translator } from "@/i18n/config";
import type { AdminAppointment, AdminAppointmentPayment, AdminCustomer, AdminServiceAddonConfiguration, AdminServiceItem, AdminStaffMember } from "@/service";
import { applyCustomerFacts, buildInvoiceFromServer, buildPaymentSettlementSummary, checkoutAddonOptions, lockedCheckoutAddonIds } from "./component";
import { CustomerAppointmentPanel } from "./CustomerAppointmentPanel";
import { initialCheckoutInvoice } from "./data";

describe("admin payment customer and appointment facts", () => {
  it.each([
    ["Asia/Ho_Chi_Minh", "Asia/Tokyo", "2026-09-27T02:00:00Z", "27/09/2026", "09:00"],
    ["Asia/Tokyo", "Asia/Ho_Chi_Minh", "2026-09-27T02:00:00Z", "27/09/2026", "11:00"],
    ["Asia/Ho_Chi_Minh", "Asia/Tokyo", "2026-09-26T16:30:00Z", "26/09/2026", "23:30"],
    ["Asia/Tokyo", "Asia/Ho_Chi_Minh", "2026-09-26T16:30:00Z", "27/09/2026", "01:30"],
    [undefined, "Asia/Ho_Chi_Minh", "2026-09-26T16:30:00Z", "26/09/2026", "23:30"],
  ])("uses frozen appointment zone %s before branch fallback %s for date and time", (frozen, fallback, startsAt, date, time) => {
    const appointment = { id: "timezone", customerId: "customer", branchId: "branch", branchTimeZone: frozen, staffId: "staff", serviceIds: [], startsAt, endsAt: startsAt, status: "CONFIRMED", total: 0, discount: 0, version: 1 } satisfies AdminAppointment;
    const invoice = buildInvoiceFromServer(appointment, { customers: new Map(), services: new Map(), staff: new Map() }, ((key: string) => key) as Translator,
      (value, timeZone) => new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(value),
      (value, timeZone) => new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(value), fallback);
    expect(invoice.appointment).toMatchObject({ date, time });
  });
  it.each([["NEW", "Khách mới"], ["LOYAL", "Khách thân thiết"], ["RETURNING", "Khách lâu năm"]])("renders the CRM segment %s instead of a fixed loyal badge", (segment, label) => {
    const invoice = applyCustomerFacts(initialCheckoutInvoice, { id: initialCheckoutInvoice.customer.id, segment, visitCount: 0, version: 1 });
    const markup = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Tokyo"><CustomerAppointmentPanel invoice={invoice} appointmentStatus="CONFIRMED" /></NextIntlClientProvider>);
    expect(markup).toContain(label);
    if (segment === "NEW") expect(markup).not.toContain("Khách thân thiết");
    expect(applyCustomerFacts(invoice, { id: invoice.customer.id, version: 2 }).customer.segment).toBe(invoice.customer.segment);
  });
  it("shows the CRM totals and the completed server status", () => {
    const customer = { id: "customer-1", displayName: "E2E Customer", phone: "0900000000", birthday: "1990-01-01", visitCount: 3, totalSpend: 25_500, preferenceSummary: "Pink", version: 1 } satisfies AdminCustomer;
    const service = { id: "service-1", name: "Gel", price: 5_000, durationMinutes: 60, active: true, version: 1 } satisfies AdminServiceItem;
    const staff = { id: "staff-1", displayName: "Nana" } as AdminStaffMember;
    const appointment = { id: "appointment-1", customerId: customer.id, branchId: "branch-1", staffId: staff.id, serviceIds: [service.id], startsAt: "2026-09-25T00:00:00.000Z", endsAt: "2026-09-25T01:00:00.000Z", status: "COMPLETED", total: 5_000, discount: 0, version: 2 } satisfies AdminAppointment;
    const translate = Object.assign((key: string) => key, { has: () => true }) as Translator;
    const invoice = buildInvoiceFromServer(appointment, { customers: new Map([[customer.id, customer]]), services: new Map([[service.id, service]]), staff: new Map([[staff.id, staff]]) }, translate, () => "25/09/2026", () => "09:00");

    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Tokyo">
        <CustomerAppointmentPanel invoice={invoice} appointmentStatus={appointment.status} />
      </NextIntlClientProvider>,
    );

    expect(invoice.customer).toMatchObject({ birthday: "1990-01-01", visits: 3, totalSpend: 25_500, preference: "Pink" });
    expect(markup).toContain("Hoàn tất");
    expect(markup).toContain("25.500");
    expect(markup).not.toContain("Đã xác nhận");
  });

  it("refreshes customer facts in the working invoice immediately after capture", () => {
    const invoice = {
      id: "appointment-1",
      customer: { id: "customer-1", name: "E2E Customer", initials: "EC", avatarUrl: null, phone: "0900000000", birthday: "", visits: 0, totalSpend: 0, preference: "" },
      appointment: { date: "25/09/2026", time: "09:00", staffName: "Nana", note: "" },
      bookedService: { id: "service-1", name: "Gel", price: 5_000 },
      currentService: { id: "service-1", name: "Gel", price: 5_000 },
      additionalItems: [],
      discount: 0,
      benefitDiscount: 0,
      manualDiscount: 0,
      discountReason: "",
      paymentMethod: "paypay" as const,
      orderNote: "",
      status: "paid" as const,
      paidAt: "2026-09-25T00:01:00.000Z",
    };
    const refreshedCustomer = { id: "customer-1", displayName: "E2E Customer", birthday: "1990-01-01", visitCount: 4, totalSpend: 30_500, preferenceSummary: "Pink", version: 2 } satisfies AdminCustomer;

    expect(applyCustomerFacts(invoice, refreshedCustomer).customer).toMatchObject({
      birthday: "1990-01-01",
      visits: 4,
      totalSpend: 30_500,
      preference: "Pink",
    });
  });
});

describe("admin payment add-on choices", () => {
  const addon = (id: string, overrides: Partial<AdminServiceItem> = {}) => ({
    id,
    name: id,
    price: 500,
    durationMinutes: 10,
    serviceType: "ADD_ON" as const,
    active: true,
    version: 1,
    ...overrides,
  });
  const configuration = {
    serviceId: "base",
    version: 1,
    addonCatalog: [],
    branches: [],
    groups: [{
      code: "REMOVAL",
      selectionMode: "SINGLE" as const,
      required: true,
      minSelections: 1,
      maxSelections: 1,
      items: [
        { ruleId: "r1", addonServiceId: "mapped", sortOrder: 0, addon: addon("mapped"), branches: [{ branchId: "branch", enabled: true, priceOverride: 700, durationOverride: 20 }] },
        { ruleId: "r2", addonServiceId: "disabled", sortOrder: 1, addon: addon("disabled"), branches: [{ branchId: "branch", enabled: false, priceOverride: null, durationOverride: null }] },
      ],
    }],
  } satisfies AdminServiceAddonConfiguration;

  it("offers only mapped branch-enabled add-ons at the effective branch price", () => {
    expect(checkoutAddonOptions(configuration, "branch", [])).toEqual([{ id: "mapped", name: "mapped", price: 700 }]);
    expect(checkoutAddonOptions(configuration, "branch", ["mapped"])).toEqual([]);
  });

  it("locks the last required add-on but leaves optional selections removable", () => {
    expect([...lockedCheckoutAddonIds(configuration, ["mapped"])]).toEqual(["mapped"]);
    expect([...lockedCheckoutAddonIds({ ...configuration, groups: [{ ...configuration.groups[0], required: false, minSelections: 0 }] }, ["mapped"])]).toEqual([]);
  });

  it("does not mix an explicit no-selection option with a real add-on", () => {
    const noSelection = addon("none", { price: 0, durationMinutes: 0, representsNoSelection: true });
    const withNone = { ...configuration, groups: [{ ...configuration.groups[0], maxSelections: 2, items: [...configuration.groups[0].items, { ruleId: "r3", addonServiceId: "none", sortOrder: 2, addon: noSelection, branches: [] }] }] };
    expect(checkoutAddonOptions(withNone, "branch", ["mapped"])).toEqual([]);
    expect(checkoutAddonOptions(withNone, "branch", ["none"])).toEqual([]);
  });
});

describe("admin payment settlement summary", () => {
  const payment = (overrides: Partial<AdminAppointmentPayment> = {}) => ({
    id: "capture-1", appointmentId: "appointment-1", kind: "CAPTURE" as const, method: "CASH", amount: 12_800,
    cashTendered: 13_000, cashChange: 200, status: "SUCCEEDED", createdAt: "2026-09-28T04:30:00.000Z", version: 1, ...overrides,
  });

  it("restores cash tender/change and full refund state from server transactions", () => {
    expect(buildPaymentSettlementSummary([
      payment(),
      payment({ id: "refund-1", kind: "REFUND", parentPaymentId: "capture-1", amount: 4_800 }),
      payment({ id: "refund-2", kind: "REFUND", parentPaymentId: "capture-1", amount: 8_000 }),
      payment({ id: "failed-refund", kind: "REFUND", parentPaymentId: "capture-1", amount: 1_000, status: "FAILED" }),
    ])).toEqual({
      status: "refunded", paymentId: "capture-1", paidAt: "2026-09-28T04:30:00.000Z", method: "CASH",
      capturedAmount: 12_800, refundedAmount: 12_800, netAmount: 0, cashTendered: 13_000, cashChange: 200,
    });
  });

  it("keeps NO_CHARGE as the recorded backend method", () => {
    expect(buildPaymentSettlementSummary([payment({ method: "NO_CHARGE", amount: 0, cashTendered: null, cashChange: null })])).toMatchObject({ status: "paid", method: "NO_CHARGE", netAmount: 0 });
    expect(buildPaymentSettlementSummary([]).status).toBe("unpaid");
  });
});
