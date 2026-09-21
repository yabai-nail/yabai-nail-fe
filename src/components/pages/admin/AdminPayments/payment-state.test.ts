import { describe, expect, it } from "vitest";
import { initialCheckoutInvoice, paymentServiceCatalog } from "./data";
import {
  addLineItem,
  buildPaymentCaptureInput,
  calculateAmountReceivedState,
  calculateCashTenderState,
  calculatePaymentTotals,
  confirmPayment,
  removeLineItem,
  replaceCurrentService,
  updateDiscount,
  updateLineItem,
} from "./payment-state";

describe("payment totals", () => {
  it("calculates the reference invoice as customer-owed money only", () => {
    expect(calculatePaymentTotals(initialCheckoutInvoice)).toEqual({
      subtotal: 12_100,
      discount: 0,
      grandTotal: 12_100,
    });
  });

  it("exposes no staff/salon revenue split — the backend owns the commission rate", () => {
    const totals = calculatePaymentTotals(initialCheckoutInvoice);

    expect(Object.keys(totals).sort()).toEqual(["discount", "grandTotal", "subtotal"]);
    expect(totals).not.toHaveProperty("staffShare");
    expect(totals).not.toHaveProperty("salonShare");
    expect(initialCheckoutInvoice).not.toHaveProperty("staffPercent");
  });

  it("clamps the discount into the subtotal before deriving the grand total", () => {
    const overDiscounted = { ...initialCheckoutInvoice, discount: 99_999 };
    expect(calculatePaymentTotals(overDiscounted)).toEqual({ subtotal: 12_100, discount: 12_100, grandTotal: 0 });

    const negative = { ...initialCheckoutInvoice, discount: -500 };
    expect(calculatePaymentTotals(negative)).toEqual({ subtotal: 12_100, discount: 0, grandTotal: 12_100 });
  });
});

describe("cash tender", () => {
  it("calculates exact and overpayment change in whole yen", () => {
    expect(calculateCashTenderState(10_000, "10000")).toEqual({ cashTendered: 10_000, cashChange: 0, error: null });
    expect(calculateCashTenderState(10_000, "15000")).toEqual({ cashTendered: 15_000, cashChange: 5_000, error: null });
  });

  it("rejects missing, fractional, malformed, and insufficient cash", () => {
    expect(calculateCashTenderState(10_000, "").error).toBe("state.cashTenderedRequired");
    expect(calculateCashTenderState(10_000, "10000.5").error).toBe("state.cashTenderedInvalid");
    expect(calculateCashTenderState(10_000, "1e4").error).toBe("state.cashTenderedInvalid");
    expect(calculateCashTenderState(10_000, "9999")).toEqual({ cashTendered: 9_999, cashChange: null, error: "state.cashTenderedInsufficient" });
  });

  it("requires no cash for a free appointment", () => {
    expect(calculateCashTenderState(0, "")).toEqual({ cashTendered: null, cashChange: null, error: null });
  });
});

describe("PayPay and VISA amount received", () => {
  it("accepts only the exact whole-yen amount due", () => {
    expect(calculateAmountReceivedState(10_000, "10000")).toEqual({ amountReceived: 10_000, error: null });
    expect(calculateAmountReceivedState(10_000, "9999")).toEqual({ amountReceived: 9_999, error: "state.amountReceivedMismatch" });
    expect(calculateAmountReceivedState(10_000, "10001")).toEqual({ amountReceived: 10_001, error: "state.amountReceivedMismatch" });
  });

  it("builds the backend capture contract for all three methods", () => {
    expect(buildPaymentCaptureInput("cash", 15_000)).toEqual({ method: "CASH", cashTendered: 15_000 });
    expect(buildPaymentCaptureInput("paypay", 10_000)).toEqual({ method: "PAYPAY", amountReceived: 10_000 });
    expect(buildPaymentCaptureInput("visa", 10_000)).toEqual({ method: "VISA", amountReceived: 10_000 });
  });

  it("rejects missing and malformed amounts and supports a zero-yen invoice", () => {
    expect(calculateAmountReceivedState(10_000, "").error).toBe("state.amountReceivedRequired");
    expect(calculateAmountReceivedState(10_000, "10000.5").error).toBe("state.amountReceivedInvalid");
    expect(calculateAmountReceivedState(0, "")).toEqual({ amountReceived: 0, error: null });
  });
});

describe("payment transitions", () => {
  it("rejects discounts outside the inclusive subtotal range", () => {
    expect(updateDiscount(initialCheckoutInvoice, -1)).toMatchObject({ ok: false });
    expect(updateDiscount(initialCheckoutInvoice, 12_101)).toMatchObject({ ok: false });
    expect(updateDiscount(initialCheckoutInvoice, 12_100)).toMatchObject({ ok: true });
  });

  it("replaces the current service without changing the booked service", () => {
    const result = replaceCurrentService(initialCheckoutInvoice, paymentServiceCatalog[2]);

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.currentService.id).toBe(paymentServiceCatalog[2].id);
    expect(result.value.bookedService).toEqual(initialCheckoutInvoice.bookedService);
    expect(initialCheckoutInvoice.currentService.id).not.toBe(paymentServiceCatalog[2].id);
  });

  it("keeps discount within the new subtotal when composition becomes cheaper", () => {
    const fullyDiscounted = { ...initialCheckoutInvoice, discount: 12_100 };
    const result = replaceCurrentService(fullyDiscounted, paymentServiceCatalog[0]);

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.discount).toBe(11_100);
  });

  it("adds, updates, and removes line items immutably", () => {
    const added = addLineItem(initialCheckoutInvoice, paymentServiceCatalog[6]);
    expect(added).toMatchObject({ ok: true });
    if (!added.ok) return;

    const newItem = added.value.additionalItems.at(-1);
    expect(newItem?.name).toBe(paymentServiceCatalog[6].name);
    expect(initialCheckoutInvoice.additionalItems).toHaveLength(3);

    const updated = updateLineItem(added.value, newItem!.id, { name: "Trang trí hoa", price: 700 });
    expect(updated).toMatchObject({ ok: true });
    if (!updated.ok) return;
    expect(updated.value.additionalItems.at(-1)).toMatchObject({ name: "Trang trí hoa", price: 700 });

    const removed = removeLineItem(updated.value, newItem!.id);
    expect(removed).toMatchObject({ ok: true });
    if (!removed.ok) return;
    expect(removed.value.additionalItems).toHaveLength(3);
  });

  it("rejects duplicate catalog services and invalid custom item values", () => {
    expect(addLineItem(initialCheckoutInvoice, paymentServiceCatalog[3])).toMatchObject({ ok: false });
    expect(addLineItem(initialCheckoutInvoice, { id: "custom", name: " ", price: 100 })).toMatchObject({ ok: false });
    expect(addLineItem(initialCheckoutInvoice, { id: "custom", name: "Phụ kiện", price: -1 })).toMatchObject({ ok: false });
  });

  it("generates a unique custom id after an earlier custom row was removed", () => {
    const invoice = {
      ...initialCheckoutInvoice,
      additionalItems: [
        ...initialCheckoutInvoice.additionalItems,
        { id: "custom-4", name: "Mẫu 4", price: 100, note: "", source: "custom" as const },
        { id: "custom-5", name: "Mẫu 5", price: 100, note: "", source: "custom" as const },
      ].filter((item) => item.id !== "custom-4"),
    };

    const result = addLineItem(invoice, { id: "custom", name: "Mẫu mới", price: 100 });

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(new Set(result.value.additionalItems.map((item) => item.id)).size).toBe(result.value.additionalItems.length);
  });

  it("rejects all money mutations after payment", () => {
    const paid = { ...initialCheckoutInvoice, status: "paid" as const, paidAt: "2026-08-16T14:30:00.000Z" };
    expect(updateDiscount(paid, 100)).toMatchObject({ ok: false });
    expect(replaceCurrentService(paid, paymentServiceCatalog[2])).toMatchObject({ ok: false });
    expect(removeLineItem(paid, paid.additionalItems[0].id)).toMatchObject({ ok: false });
  });

  it("requires a payment method and records the supplied confirmation timestamp", () => {
    expect(confirmPayment({ ...initialCheckoutInvoice, paymentMethod: null }, "2026-08-16T14:30:00.000Z")).toMatchObject({ ok: false });

    const result = confirmPayment(initialCheckoutInvoice, "2026-08-16T14:30:00.000Z");
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({ status: "paid", paidAt: "2026-08-16T14:30:00.000Z" });
  });

  it("rejects confirmation when the invoice totals are invalid", () => {
    expect(confirmPayment({ ...initialCheckoutInvoice, discount: 20_000 }, "2026-08-16T14:30:00.000Z")).toMatchObject({ ok: false });
    expect(confirmPayment({ ...initialCheckoutInvoice, currentService: { ...initialCheckoutInvoice.currentService, price: -1 } }, "2026-08-16T14:30:00.000Z")).toMatchObject({ ok: false });
  });
});
