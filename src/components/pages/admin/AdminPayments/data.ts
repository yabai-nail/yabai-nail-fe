import type { Translator } from "@/i18n/config";

export type PaymentMethod = "cash" | "card" | "paypay" | "bank_transfer" | "other";
export type InvoiceStatus = "draft" | "paid";

export type PaymentCustomerSnapshot = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  readonly birthday: string;
  readonly visits: number;
  readonly totalSpend: number;
  readonly preference: string;
};

export type PaymentAppointmentSnapshot = {
  readonly date: string;
  readonly time: string;
  readonly staffName: string;
  readonly note: string;
};

export type PaymentServiceSnapshot = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
};

export type PaymentLineItem = PaymentServiceSnapshot & {
  readonly note: string;
  readonly source: "catalog" | "custom";
};

export type CheckoutInvoice = {
  readonly id: string;
  readonly customer: PaymentCustomerSnapshot;
  readonly appointment: PaymentAppointmentSnapshot;
  readonly bookedService: PaymentServiceSnapshot;
  readonly currentService: PaymentServiceSnapshot;
  readonly additionalItems: ReadonlyArray<PaymentLineItem>;
  readonly discount: number;
  readonly paymentMethod: PaymentMethod | null;
  readonly orderNote: string;
  readonly status: InvoiceStatus;
  readonly paidAt: string | null;
};

export const paymentServiceCatalog: ReadonlyArray<PaymentServiceSnapshot> = [
  { id: "service-basic-gel", name: "Sơn gel cơ bản", price: 8_500 },
  { id: "service-advanced-gel", name: "Sơn gel nâng cao", price: 9_500 },
  { id: "service-design", name: "Thiết kế theo mẫu", price: 10_500 },
  { id: "addon-tip", name: "Đổ khuôn thành giả", price: 1_000 },
  { id: "addon-extension", name: "Nối thêm móng (2 móng)", price: 1_100 },
  { id: "addon-reinforce", name: "Gia cố móng", price: 500 },
  { id: "addon-charm", name: "Thêm charm", price: 300 },
] as const;

const [bookedService, currentService, , tipService, extensionService, reinforceService] = paymentServiceCatalog;

export const initialCheckoutInvoice: CheckoutInvoice = {
  id: "invoice-local-1",
  customer: {
    id: "c1",
    name: "Nguyễn Thu Hương",
    initials: "NH",
    phone: "0901 234 567",
    birthday: "25/06/1996",
    visits: 12,
    totalSpend: 18_560_000,
    preference: "Thích tone hồng, nail dài vừa phải.",
  },
  appointment: {
    date: "16/08/2026 (Chủ Nhật)",
    time: "14:00",
    staffName: "Mai Linh",
    note: "Thích tone hồng, nail dài vừa phải.",
  },
  bookedService,
  currentService,
  additionalItems: [
    { ...tipService, note: "Charm thành giả đổ khuôn", source: "catalog" },
    { ...extensionService, note: "Nối móng số 4, 5", source: "catalog" },
    { ...reinforceService, note: "Móng cái tay phải", source: "catalog" },
  ],
  discount: 0,
  paymentMethod: "cash",
  orderNote: "",
  status: "draft",
  paidAt: null,
};

/**
 * Both read a catalogue the API's own enum is keyed by, and both fall back to the raw code:
 * a method or a provider status this build has never seen renders as itself rather than as
 * a blank. `paymentMethodLabel` takes the shared `admin.paymentMethod` translator, which the
 * dashboard and operations screens read too; `paymentStatusLabel` takes this screen's own.
 */
export function paymentMethodLabel(method: string, t: Translator): string {
  const key = method.toLowerCase();
  return t.has(key) ? t(key) : method;
}

export function paymentStatusLabel(status: string, t: Translator): string {
  const key = `status.${status.toUpperCase()}`;
  return t.has(key) ? t(key) : status;
}

