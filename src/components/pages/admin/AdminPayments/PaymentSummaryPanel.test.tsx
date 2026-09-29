import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import { initialCheckoutInvoice } from "./data";
import { calculatePaymentTotals } from "./payment-state";
import { PaymentSummaryPanel, validatePaymentAdjustmentDraft } from "./PaymentSummaryPanel";

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
        onConfirm={async () => null}
        onDraftDiscountChange={() => {}}
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

describe("payment adjustment draft", () => {
  it("normalizes a valid discount before save or confirmation", () => {
    expect(validatePaymentAdjustmentDraft(12_980, 0, "1000", "  Khách quen  ", "  Ghi chú  ")).toEqual({
      ok: true,
      value: 1_000,
      discountReason: "Khách quen",
      checkoutNote: "Ghi chú",
    });
  });

  it("rejects invalid money and a missing discount reason", () => {
    expect(validatePaymentAdjustmentDraft(12_980, 0, "12981", "Khách quen", "")).toEqual({ ok: false, error: "state.discountRange" });
    expect(validatePaymentAdjustmentDraft(12_980, 0, "1000", " ", "")).toEqual({ ok: false, error: "summary.discountReasonRequired" });
  });

  it("matches the backend 120-character discount-reason limit", () => {
    expect(validatePaymentAdjustmentDraft(12_980, 0, "1000", "a".repeat(120), "")).toMatchObject({ ok: true });
    expect(validatePaymentAdjustmentDraft(12_980, 0, "1000", "a".repeat(121), "")).toEqual({ ok: false, error: "state.discountInvalid" });
    expect(render("draft")).toContain('id="discount-reason"');
    expect(render("draft")).toContain('maxLength="120"');
  });
});
