import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import messages from "../../../../../messages/vi.json";
import type { AdminPaymentHistoryItem } from "@/service";
import { PaymentHistoryTable } from "./PaymentHistoryTable";

describe("payment history table", () => {
  it("shows receipt facts and an explicit detail action", () => {
    const item = {
      id: "payment-12345678",
      appointmentId: "appointment-87654321",
      kind: "CAPTURE",
      method: "CASH",
      amount: 10_000,
      cashTendered: 20_000,
      cashChange: 10_000,
      status: "SUCCEEDED",
      settlementStatus: "PARTIALLY_REFUNDED",
      refundedAmount: 2_000,
      netAmount: 8_000,
      paidAt: "2026-09-29T03:00:00.000Z",
      createdAt: "2026-09-29T03:00:00.000Z",
      version: 1,
      customer: { id: "customer-1", displayName: "Cao Thị Tâm", phone: "0914162253" },
      staff: { id: "staff-1", displayName: "CHI_LINH_3" },
      services: [{ id: "service-1", name: "Gel dài móng", unitPrice: 10_000, durationMinutes: 90 }],
    } satisfies AdminPaymentHistoryItem;

    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Tokyo">
        <PaymentHistoryTable items={[item]} onSelect={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(markup).toContain("Cao Thị Tâm");
    expect(markup).toContain("Gel dài móng");
    expect(markup).toContain("¥10.000");
    expect(markup).toContain("Hoàn một phần");
    expect(markup).toContain("Xem chi tiết");
  });
});
