import type {
  CheckoutInvoice,
  PaymentLineItem,
  PaymentMethod,
  PaymentServiceSnapshot,
} from "./data";

export type PaymentTotals = {
  readonly subtotal: number;
  readonly discount: number;
  readonly grandTotal: number;
};

export type PaymentTransitionResult =
  | { readonly ok: true; readonly value: CheckoutInvoice }
  | { readonly ok: false; readonly error: string };

const success = (value: CheckoutInvoice): PaymentTransitionResult => ({ ok: true, value });
const failure = (error: string): PaymentTransitionResult => ({ ok: false, error });

function requireDraft(invoice: CheckoutInvoice) {
  return invoice.status === "draft" ? null : "Hóa đơn đã thanh toán nên không thể thay đổi số tiền.";
}

function isValidMoney(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

function validateItem(item: PaymentServiceSnapshot) {
  if (!item.name.trim()) return "Tên dịch vụ không được để trống.";
  if (!isValidMoney(item.price)) return "Giá dịch vụ phải là số nguyên không âm.";
  return null;
}

function keepDiscountWithinSubtotal(invoice: CheckoutInvoice) {
  const subtotal = invoice.currentService.price + invoice.additionalItems.reduce((sum, item) => sum + item.price, 0);
  return invoice.discount <= subtotal ? invoice : { ...invoice, discount: subtotal };
}

function nextCustomId(items: ReadonlyArray<PaymentLineItem>) {
  const usedIds = new Set(items.map((item) => item.id));
  let sequence = items.length + 1;
  while (usedIds.has(`custom-${sequence}`)) sequence += 1;
  return `custom-${sequence}`;
}

function validateInvoice(invoice: CheckoutInvoice) {
  const serviceError = validateItem(invoice.currentService) ?? invoice.additionalItems.map(validateItem).find(Boolean);
  if (serviceError) return serviceError;
  const subtotal = invoice.currentService.price + invoice.additionalItems.reduce((sum, item) => sum + item.price, 0);
  if (!isValidMoney(invoice.discount) || invoice.discount > subtotal) return "Giảm giá không hợp lệ.";
  return null;
}

/**
 * Money the customer owes. Deliberately no staff/salon split: the commission
 * rate is a property of the STAFF MEMBER over time (backend STAFF_COMPENSATION
 * records with effectiveFrom + history), never of a single invoice, and the
 * capture endpoint accepts neither a rate nor an amount from this screen — it
 * recomputes the commission from that record. Any split rendered here would be
 * a made-up wage figure.
 */
export function calculatePaymentTotals(invoice: CheckoutInvoice): PaymentTotals {
  const subtotal = invoice.currentService.price + invoice.additionalItems.reduce((sum, item) => sum + item.price, 0);
  const discount = Math.min(Math.max(invoice.discount, 0), subtotal);

  return { subtotal, discount, grandTotal: subtotal - discount };
}

export function replaceCurrentService(invoice: CheckoutInvoice, service: PaymentServiceSnapshot): PaymentTransitionResult {
  const locked = requireDraft(invoice);
  if (locked) return failure(locked);
  const error = validateItem(service);
  if (error) return failure(error);
  return success(keepDiscountWithinSubtotal({ ...invoice, currentService: { ...service } }));
}

export function addLineItem(invoice: CheckoutInvoice, service: PaymentServiceSnapshot): PaymentTransitionResult {
  const locked = requireDraft(invoice);
  if (locked) return failure(locked);
  const error = validateItem(service);
  if (error) return failure(error);
  if (service.id !== "custom" && invoice.additionalItems.some((item) => item.id === service.id)) {
    return failure("Dịch vụ này đã có trong hóa đơn.");
  }

  const id = service.id === "custom" ? nextCustomId(invoice.additionalItems) : service.id;
  const item: PaymentLineItem = { ...service, id, name: service.name.trim(), note: "", source: service.id === "custom" ? "custom" : "catalog" };
  return success({ ...invoice, additionalItems: [...invoice.additionalItems, item] });
}

export function updateLineItem(invoice: CheckoutInvoice, itemId: string, patch: Pick<PaymentLineItem, "name" | "price"> & Partial<Pick<PaymentLineItem, "note">>): PaymentTransitionResult {
  const locked = requireDraft(invoice);
  if (locked) return failure(locked);
  const error = validateItem({ id: itemId, name: patch.name, price: patch.price });
  if (error) return failure(error);
  if (!invoice.additionalItems.some((item) => item.id === itemId)) return failure("Không tìm thấy dịch vụ cần sửa.");
  return success(keepDiscountWithinSubtotal({
    ...invoice,
    additionalItems: invoice.additionalItems.map((item) => item.id === itemId ? { ...item, ...patch, name: patch.name.trim() } : item),
  }));
}

export function removeLineItem(invoice: CheckoutInvoice, itemId: string): PaymentTransitionResult {
  const locked = requireDraft(invoice);
  if (locked) return failure(locked);
  if (!invoice.additionalItems.some((item) => item.id === itemId)) return failure("Không tìm thấy dịch vụ cần xóa.");
  return success(keepDiscountWithinSubtotal({ ...invoice, additionalItems: invoice.additionalItems.filter((item) => item.id !== itemId) }));
}

export function updateDiscount(invoice: CheckoutInvoice, discount: number): PaymentTransitionResult {
  const locked = requireDraft(invoice);
  if (locked) return failure(locked);
  const { subtotal } = calculatePaymentTotals(invoice);
  if (!isValidMoney(discount) || discount > subtotal) return failure("Giảm giá phải từ 0 đến tổng tiền dịch vụ.");
  return success({ ...invoice, discount });
}

export function setPaymentMethod(invoice: CheckoutInvoice, paymentMethod: PaymentMethod): PaymentTransitionResult {
  const locked = requireDraft(invoice);
  if (locked) return failure(locked);
  return success({ ...invoice, paymentMethod });
}

export function confirmPayment(invoice: CheckoutInvoice, paidAt: string): PaymentTransitionResult {
  const locked = requireDraft(invoice);
  if (locked) return failure(locked);
  if (!invoice.paymentMethod) return failure("Vui lòng chọn phương thức thanh toán.");
  const invoiceError = validateInvoice(invoice);
  if (invoiceError) return failure(invoiceError);
  if (!paidAt || Number.isNaN(Date.parse(paidAt))) return failure("Thời gian xác nhận không hợp lệ.");
  return success({ ...invoice, status: "paid", paidAt });
}
