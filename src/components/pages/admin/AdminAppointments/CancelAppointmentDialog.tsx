import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button } from "@heroui/react";
import type { Appointment } from "./data";

export function CancelAppointmentDialog({ appointment, onClose, onConfirm }: Readonly<{
  appointment: Appointment;
  onClose: () => void;
  onConfirm: () => void;
}>) {
  return (
    <AlertDialog isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
        <AlertDialog.Container size="sm" placement="center">
          <AlertDialog.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <AlertDialog.Header className="flex items-center gap-3 px-5 pt-5">
              <AlertDialog.Icon status="danger"><ExclamationTriangleIcon className="size-5" /></AlertDialog.Icon>
              <AlertDialog.Heading className="text-lg font-bold text-admin-ink">Hủy lịch hẹn?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="px-5 py-4 text-sm leading-6 text-admin-muted">
              Lịch của <strong className="text-admin-ink">{appointment.customer.name}</strong> lúc {appointment.startTime} ngày {appointment.date.split("-").reverse().join("/")} sẽ chuyển sang trạng thái đã hủy.
            </AlertDialog.Body>
            <AlertDialog.Footer className="border-t border-admin-border px-5 py-4">
              <Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>Giữ lịch hẹn</Button>
              <Button variant="danger" className="rounded-lg" onPress={onConfirm}>Xác nhận hủy</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
