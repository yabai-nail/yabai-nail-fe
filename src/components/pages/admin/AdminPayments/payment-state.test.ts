import { describe, expect, it } from "vitest";
import { initialCheckoutInvoice, paymentServiceCatalog } from "./data";
import {
  addLineItem,
  calculatePaymentTotals,
  confirmPayment,
  removeLineItem,
  replaceCurrentService,
  updateDiscount,
  updateLineItem,
  updateStaffPercent,
} from "./payment-state";

describe("payment totals", () => {
  it("calculates the reference invoice and preserves the full amount in the revenue split", () => {
    expect(calculatePaymentTotals(initialCheckoutInvoice)).toEqual({
      subtotal: 12_100,
      discount: 0,
      grandTotal: 12_100,
      staffShare: 7_260,
      salonShare: 4_840,
    });
  });

  it("keeps the split exact for boundary percentages and odd totals", () => {
    expect(calculatePaymentTotals({ ...initialCheckoutInvoice, staffPercent: 0 }).staffShare).toBe(0);
    expect(calculatePaymentTotals({ ...initialCheckoutInvoice, staffPercent: 100 }).salonShare).toBe(0);

    const result = calculatePaymentTotals({
      ...initialCheckoutInvoice,
      currentService: { ...initialCheckoutInvoice.currentService, price: 101 },
      additionalItems: [],
      staffPercent: 50,
    });
    expect(result.staffShare + result.salonShare).toBe(result.grandTotal);
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

  it("rejects invalid percentages and all money mutations after payment", () => {
    expect(updateStaffPercent(initialCheckoutInvoice, 101)).toMatchObject({ ok: false });

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
