import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { formatMoney } from "@/lib/admin-format";
import { paymentServiceCatalog, type PaymentServiceSnapshot } from "./data";

export function ServiceSelectionModal({ currentId, onClose, onSelect }: Readonly<{
  currentId: string;
  onClose: () => void;
  onSelect: (service: PaymentServiceSnapshot) => void;
}>) {
  const primaryServices = paymentServiceCatalog.slice(0, 3);
  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop><Modal.Container size="md" placement="center"><Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
        <Modal.CloseTrigger className="rounded-lg" />
        <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4"><span className="grid size-9 place-items-center rounded-lg bg-admin-soft text-admin-accent"><ArrowPathIcon className="size-5" /></span><div><Modal.Heading className="text-lg font-bold text-admin-ink">Đổi dịch vụ chính</Modal.Heading><p className="text-xs text-admin-muted">Chọn dịch vụ thực tế khách đã sử dụng.</p></div></Modal.Header>
        <Modal.Body className="space-y-2 px-5 py-5">
          {primaryServices.map((service) => <Button key={service.id} variant={service.id === currentId ? "primary" : "outline"} className="h-auto w-full justify-between rounded-lg border-admin-border px-4 py-3" onPress={() => onSelect(service)}><span className="text-left"><span className="block font-semibold">{service.name}</span><span className="block text-xs opacity-75">{formatMoney(service.price)}</span></span>{service.id === currentId ? "Đang chọn" : "Chọn"}</Button>)}
        </Modal.Body>
        <Modal.Footer className="border-t border-admin-border px-5 py-4"><Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>Đóng</Button></Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  );
}

