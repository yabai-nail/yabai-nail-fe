import { CheckIcon, PencilSquareIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useState } from "react";
import { formatVnd } from "@/lib/admin-format";
import type { CheckoutInvoice } from "./data";
import { updateDiscount, updateStaffPercent, type PaymentTotals } from "./payment-state";

const fieldClassName = "min-h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:bg-admin-canvas disabled:text-admin-muted";

export function PaymentSummaryPanel({ invoice, totals, onChange, onConfirm, onPreview }: Readonly<{
  invoice: CheckoutInvoice;
  totals: PaymentTotals;
  onChange: (invoice: CheckoutInvoice) => void;
  onConfirm: () => void;
  onPreview: () => void;
}>) {
  const [discount, setDiscount] = useState(String(invoice.discount));
  const [error, setError] = useState("");
  const isPaid = invoice.status === "paid";

  function applyDiscount() {
    const result = updateDiscount(invoice, Number(discount));
    if (!result.ok) return setError(result.error);
    setError("");
    onChange(result.value);
  }

  return <Card className="h-fit gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none lg:col-span-2 2xl:col-span-1"><Card.Header className="flex items-center justify-between border-b border-admin-border px-4 py-3"><h2 className="font-bold text-admin-ink">Tổng thanh toán</h2><Chip size="sm" variant="soft" color={isPaid ? "success" : "warning"}><Chip.Label>{isPaid ? "Đã thanh toán" : "Chờ thanh toán"}</Chip.Label></Chip></Card.Header><Card.Content className="space-y-5 px-4 py-4">
    <dl className="space-y-3 text-sm"><SummaryRow label="Tổng tiền dịch vụ" value={formatVnd(totals.subtotal)} /><div><label htmlFor="payment-discount" className="mb-2 block text-xs font-semibold text-admin-ink">Giảm giá (VND)</label><div className="flex gap-2"><input id="payment-discount" className={fieldClassName} type="number" min="0" max={totals.subtotal} step="1" value={discount} disabled={isPaid} aria-invalid={Boolean(error)} aria-describedby={error ? "payment-discount-error" : undefined} onChange={(event) => setDiscount(event.target.value)} /><Button isIconOnly variant="outline" className="shrink-0 rounded-lg border-admin-border" isDisabled={isPaid} aria-label="Áp dụng giảm giá" onPress={applyDiscount}><PencilSquareIcon className="size-4" /></Button></div>{error ? <p id="payment-discount-error" role="alert" className="mt-1 text-xs text-danger">{error}</p> : null}</div><SummaryRow label="Khách cần thanh toán" value={formatVnd(totals.grandTotal)} strong /></dl>
    <section className="border-t border-admin-border pt-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-admin-ink">Chia doanh thu</h3><span className="text-xs text-admin-muted">Tổng 100%</span></div><label htmlFor="staff-percent" className="text-xs font-semibold text-admin-ink">Nhân viên: {invoice.staffPercent}%</label><input id="staff-percent" type="range" min="0" max="100" step="1" value={invoice.staffPercent} disabled={isPaid} className="mt-2 w-full accent-admin-accent" onChange={(event) => { const result = updateStaffPercent(invoice, Number(event.target.value)); if (result.ok) onChange(result.value); }} /><div className="mt-3 grid grid-cols-2 divide-x divide-admin-border rounded-lg border border-admin-border"><Revenue label={invoice.appointment.staffName} percent={invoice.staffPercent} amount={totals.staffShare} /><Revenue label="Quán" percent={100 - invoice.staffPercent} amount={totals.salonShare} /></div></section>
    <label htmlFor="order-note" className="block text-xs font-semibold text-admin-ink">Ghi chú đơn hàng<textarea id="order-note" className={`${fieldClassName} mt-2 min-h-24 py-2`} maxLength={500} value={invoice.orderNote} onChange={(event) => onChange({ ...invoice, orderNote: event.target.value })} placeholder="Nhập ghi chú nếu có..." /></label>
    <div className="grid gap-2"><Button variant="primary" className="rounded-lg" isDisabled={isPaid} onPress={onConfirm}><CheckIcon className="size-4" />{isPaid ? "Đã thanh toán" : "Xác nhận thanh toán"}</Button><Button variant="outline" className="rounded-lg border-admin-border" onPress={onPreview}><PrinterIcon className="size-4" />Xem & in hóa đơn</Button></div>
  </Card.Content></Card>;
}

function SummaryRow({ label, value, strong = false }: Readonly<{ label: string; value: string; strong?: boolean }>) { return <div className="flex items-center justify-between gap-3"><dt className={strong ? "font-bold text-admin-ink" : "text-admin-muted"}>{label}</dt><dd className={strong ? "text-xl font-bold text-admin-accent" : "font-semibold text-admin-ink"}>{value}</dd></div>; }
function Revenue({ label, percent, amount }: Readonly<{ label: string; percent: number; amount: number }>) { return <div className="p-3 text-center"><p className="truncate text-xs text-admin-muted">{label}</p><p className="mt-1 text-xs font-semibold">{percent}%</p><p className="mt-2 font-bold text-admin-accent">{formatVnd(amount)}</p></div>; }
