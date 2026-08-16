import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button } from "@heroui/react";
import { formatVnd } from "@/lib/admin-format";
import { paymentMethodLabels, type CheckoutInvoice } from "./data";
import type { PaymentTotals } from "./payment-state";

export function PaymentConfirmationDialog({ invoice, totals, onClose, onConfirm }: Readonly<{
  invoice: CheckoutInvoice;
  totals: PaymentTotals;
  onClose: () => void;
  onConfirm: () => void;
}>) {
  return <AlertDialog isOpen onOpenChange={(open) => { if (!open) onClose(); }}><AlertDialog.Backdrop><AlertDialog.Container size="sm" placement="center"><AlertDialog.Dialog className="rounded-xl border border-admin-border bg-admin-surface"><AlertDialog.Header className="flex items-center gap-3 px-5 pt-5"><AlertDialog.Icon status="success"><CheckCircleIcon className="size-5" /></AlertDialog.Icon><AlertDialog.Heading className="text-lg font-bold text-admin-ink">Xác nhận thanh toán?</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body className="space-y-3 px-5 py-4 text-sm text-admin-muted"><p>Khách hàng: <strong className="text-admin-ink">{invoice.customer.name}</strong></p><p>Số tiền: <strong className="text-admin-accent">{formatVnd(totals.grandTotal)}</strong></p><p>Phương thức: <strong className="text-admin-ink">{invoice.paymentMethod ? paymentMethodLabels[invoice.paymentMethod] : "Chưa chọn"}</strong></p><p className="rounded-lg bg-admin-soft p-3 text-xs">Đây là thao tác mô phỏng, không tạo giao dịch tài chính thật.</p></AlertDialog.Body><AlertDialog.Footer className="border-t border-admin-border px-5 py-4"><Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>Kiểm tra lại</Button><Button variant="primary" className="rounded-lg" onPress={onConfirm}>Xác nhận</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop></AlertDialog>;
}

