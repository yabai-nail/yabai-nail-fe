import {
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { AlertDialog, Button, Card, Chip, Modal } from "@heroui/react";
import { useState, type FormEvent } from "react";
import { formatVnd } from "@/lib/admin-format";
import type { CheckoutInvoice, PaymentAppointmentSnapshot } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

const fieldClassName = "min-h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

export function CustomerAppointmentPanel({ invoice, isCancelled, onAppointmentChange, onCancel }: Readonly<{
  invoice: CheckoutInvoice;
  isCancelled: boolean;
  onAppointmentChange: (patch: Partial<PaymentAppointmentSnapshot>) => void;
  onCancel: () => void;
}>) {
  const [mode, setMode] = useState<"staff" | "datetime" | "cancel" | null>(null);
  const [staffName, setStaffName] = useState(invoice.appointment.staffName);
  const [date, setDate] = useState("2026-08-16");
  const [time, setTime] = useState(invoice.appointment.time);

  function saveContext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "staff") onAppointmentChange({ staffName });
    if (mode === "datetime") onAppointmentChange({ date: `${date.split("-").reverse().join("/")} (Chủ Nhật)`, time });
    setMode(null);
  }

  return (
    <>
      <Card className="h-fit gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="flex flex-row items-center justify-between border-b border-admin-border px-4 py-3">
          <h2 className="text-sm font-bold text-admin-ink">Thông tin khách hàng</h2>
          {/* A "..." with no menu behind it. Customer actions live on the customer
              screen; this only looked like an affordance. */}
        </Card.Header>
        <Card.Content className="space-y-5 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-admin-soft font-bold text-admin-accent" aria-hidden="true">{invoice.customer.initials}</span>
            <div className="min-w-0">
              <p className="truncate font-bold text-admin-ink">{invoice.customer.name}</p>
              <Chip size="sm" variant="soft" color="accent"><Chip.Label>Khách thân thiết</Chip.Label></Chip>
            </div>
          </div>
          <dl className="space-y-2 text-xs text-admin-muted">
            <InfoRow icon={PhoneIcon} label="Điện thoại" value={invoice.customer.phone} />
            <InfoRow icon={CalendarDaysIcon} label="Ngày sinh" value={invoice.customer.birthday} />
            <InfoRow icon={UserIcon} label="Lần đến" value={`${invoice.customer.visits} lần`} />
            <div className="flex justify-between gap-3 border-t border-admin-border pt-3"><dt>Tổng chi tiêu</dt><dd className="font-semibold text-admin-ink">{formatVnd(invoice.customer.totalSpend)}</dd></div>
          </dl>
          <div className="border-t border-admin-border pt-4">
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-admin-ink">Thông tin lịch hẹn</h3><Chip size="sm" variant="soft" color={isCancelled ? "danger" : "success"}><Chip.Label>{isCancelled ? "Đã hủy" : "Đã xác nhận"}</Chip.Label></Chip></div>
            <dl className="space-y-3 text-xs text-admin-muted">
              <InfoRow icon={CalendarDaysIcon} label="Ngày hẹn" value={invoice.appointment.date} />
              <InfoRow icon={ClockIcon} label="Giờ hẹn" value={invoice.appointment.time} />
              <InfoRow icon={UserIcon} label="Nhân viên" value={invoice.appointment.staffName} />
            </dl>
            <p className="mt-4 rounded-lg bg-admin-soft p-3 text-xs leading-5 text-admin-muted">{invoice.appointment.note}</p>
          </div>
          <div className="grid gap-2">
            <Button variant="outline" className="rounded-lg border-admin-border" isDisabled={isCancelled} onPress={() => setMode("staff")}><UserIcon className="size-4" />Đổi nhân viên</Button>
            <Button variant="outline" className="rounded-lg border-admin-border" isDisabled={isCancelled} onPress={() => setMode("datetime")}><CalendarDaysIcon className="size-4" />Đổi ngày giờ</Button>
            <Button variant="outline" className="rounded-lg border-admin-accent text-admin-accent" isDisabled={isCancelled} onPress={() => setMode("cancel")}>Hủy lịch hẹn</Button>
          </div>
        </Card.Content>
      </Card>

      {mode === "staff" || mode === "datetime" ? (
        <Modal isOpen onOpenChange={(open) => { if (!open) setMode(null); }}>
          <Modal.Backdrop><Modal.Container size="sm" placement="center"><Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <Modal.CloseTrigger className="rounded-lg" />
            <Modal.Header className="border-b border-admin-border px-5 py-4"><Modal.Heading className="text-lg font-bold text-admin-ink">{mode === "staff" ? "Đổi nhân viên" : "Đổi ngày giờ"}</Modal.Heading></Modal.Header>
            <form onSubmit={saveContext} className="flex min-h-0 flex-1 flex-col"><Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {mode === "staff" ? <div className="block text-sm font-semibold text-admin-ink">Nhân viên<AdminSelectField label="Nhân viên" fullWidth className="mt-2" value={staffName} onChange={setStaffName} options={["Mai Linh", "Thảo Vy", "Quỳnh Anh"].map((name) => ({ value: name, label: name }))} /></div> : <><label className="block text-sm font-semibold text-admin-ink">Ngày<input className={`${fieldClassName} mt-2`} type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="block text-sm font-semibold text-admin-ink">Giờ<input className={`${fieldClassName} mt-2`} type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label></>}
            </Modal.Body><Modal.Footer className="border-t border-admin-border px-5 py-4"><Button type="button" variant="outline" className="rounded-lg border-admin-border" onPress={() => setMode(null)}>Đóng</Button><Button type="submit" variant="primary" className="rounded-lg">Lưu thay đổi</Button></Modal.Footer></form>
          </Modal.Dialog></Modal.Container></Modal.Backdrop>
        </Modal>
      ) : null}

      {mode === "cancel" ? <AlertDialog isOpen onOpenChange={(open) => { if (!open) setMode(null); }}><AlertDialog.Backdrop><AlertDialog.Container size="sm" placement="center"><AlertDialog.Dialog className="rounded-xl border border-admin-border bg-admin-surface"><AlertDialog.Header className="flex items-center gap-3 px-5 pt-5"><AlertDialog.Icon status="danger"><ExclamationTriangleIcon className="size-5" /></AlertDialog.Icon><AlertDialog.Heading className="text-lg font-bold text-admin-ink">Hủy lịch hẹn?</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body className="px-5 py-4 text-sm text-admin-muted">Lịch hẹn sẽ chuyển sang trạng thái đã hủy trong phiên hiện tại.</AlertDialog.Body><AlertDialog.Footer className="border-t border-admin-border px-5 py-4"><Button variant="outline" className="rounded-lg border-admin-border" onPress={() => setMode(null)}>Giữ lịch</Button><Button variant="danger" className="rounded-lg" onPress={() => { onCancel(); setMode(null); }}>Xác nhận hủy</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop></AlertDialog> : null}
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: Readonly<{ icon: typeof PhoneIcon; label: string; value: string }>) {
  return <div className="grid grid-cols-[1rem_5rem_minmax(0,1fr)] items-start gap-2"><Icon aria-hidden="true" className="size-4" /><dt>{label}</dt><dd className="break-words font-medium text-admin-ink">{value}</dd></div>;
}
