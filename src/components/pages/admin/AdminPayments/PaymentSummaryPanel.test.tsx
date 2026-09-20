import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import { initialCheckoutInvoice } from "./data";
import { calculatePaymentTotals } from "./payment-state";
import { PaymentSummaryPanel } from "./PaymentSummaryPanel";

function render(status: "draft" | "paid", canCreateReview = true) {
  const invoice = {
    ...initialCheckoutInvoice,
    status,
    paidAt: status === "paid" ? "2026-09-20T09:30:00.000Z" : null,
  };

  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Tokyo">
      <PaymentSummaryPanel
        invoice={invoice}
        totals={calculatePaymentTotals(invoice)}
        canAdjust={status === "draft"}
        canConfirmPayment={status === "draft"}
        canCreateReview={canCreateReview}
        onSaveAdjustments={async () => null}
        onConfirm={() => {}}
        onPreview={() => {}}
        onReview={() => {}}
      />
    </NextIntlClientProvider>,
  );
}

describe("PaymentSummaryPanel review action", () => {
  it("shows the customer review action below invoice preview after payment", () => {
    const markup = render("paid");

    expect(markup).toContain("Xem &amp; in hóa đơn");
    expect(markup).toContain("Đánh giá khách hàng");
    expect(markup.indexOf("Đánh giá khách hàng")).toBeGreaterThan(markup.indexOf("Xem &amp; in hóa đơn"));
  });

  it("hides the review action before payment or without permission", () => {
    expect(render("draft")).not.toContain("Đánh giá khách hàng");
    expect(render("paid", false)).not.toContain("Đánh giá khách hàng");
  });
});
