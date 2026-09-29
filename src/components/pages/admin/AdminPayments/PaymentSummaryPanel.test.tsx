import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import { initialCheckoutInvoice } from "./data";
import { calculatePaymentTotals } from "./payment-state";
import { PaymentSummaryPanel, validatePaymentAdjustmentDraft } from "./PaymentSummaryPanel";

function render(status: "draft" | "paid", canCreateReview = true, overrides: Partial<typeof initialCheckoutInvoice> = {}) {
  const invoice = {
    ...initialCheckoutInvoice,
    ...overrides,
    status,
    paidAt: status === "paid" ? "2026-09-20T09:30:00.000Z" : null,
  };

  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Tokyo">
      <PaymentSummaryPanel
        invoice={invoice}
        totals={calculatePaymentTotals(invoice)}
        canAdjust={status === "draft"}
        canUsePoints={status === "draft"}
        canConfirmPayment={status === "draft"}
        canCreateReview={canCreateReview}
        onSaveAdjustments={async () => null}
        onConfirm={async () => null}
        onDraftDiscountChange={() => {}}
        onDraftPointsChange={() => {}}
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
  it("shows customer consent, available points, and the exact point input", () => {
    const markup = render("draft", true, { pointsRequested: 1_000, benefitDiscount: 1_000, discount: 1_000 });
    expect(markup).toContain('id="use-customer-points"');
    expect(markup).toContain('id="points-requested"');
    expect(markup).toContain("Sử dụng điểm");
    expect(markup).toContain("5.000 điểm khả dụng");
  });

  it("keeps the point card visible and prominent when the customer has no points", () => {
    const markup = render("draft", true, {
      customer: { ...initialCheckoutInvoice.customer, pointBalance: 0 },
    });

    expect(markup).toContain('id="use-customer-points"');
    expect(markup).toContain("0 điểm khả dụng");
    expect(markup).toContain("Khách chưa có điểm để sử dụng.");
    expect(markup).toContain("text-2xl");
    expect(markup).toContain('disabled=""');
  });

  it("lets a customer with only 10 points opt in and enter points one at a time", () => {
    const markup = render("draft", true, {
      customer: { ...initialCheckoutInvoice.customer, pointBalance: 10 },
      pointsRequested: 10,
      benefitDiscount: 10,
      discount: 10,
    });
    const checkbox = markup.match(/<input id="use-customer-points"[^>]*>/)?.[0] ?? "";

    expect(markup).toContain("10 điểm khả dụng");
    expect(markup).toContain('id="points-requested"');
    expect(markup).toContain('step="1"');
    expect(checkbox).not.toContain("disabled");
  });

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
