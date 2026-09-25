import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import type { Translator } from "@/i18n/config";
import type { AdminAppointment, AdminCustomer, AdminServiceItem, AdminStaffMember } from "@/service";
import { applyCustomerFacts, buildInvoiceFromServer } from "./component";
import { CustomerAppointmentPanel } from "./CustomerAppointmentPanel";

describe("admin payment customer and appointment facts", () => {
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
