import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState, type FormEvent } from "react";
import { paymentServiceCatalog, type PaymentLineItem, type PaymentServiceSnapshot } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

const fieldClassName = "min-h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

export function LineItemModal({ item, onClose, onSubmit }: Readonly<{
  item: PaymentLineItem | null;
  onClose: () => void;
  onSubmit: (service: PaymentServiceSnapshot, note: string) => string | null;
}>) {
  const catalog = paymentServiceCatalog.slice(3);
  const [selectedId, setSelectedId] = useState(item?.source === "catalog" ? item.id : "custom");
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [note, setNote] = useState(item?.note ?? "");
  const [error, setError] = useState("");
  const isCustom = item?.source === "custom" || selectedId === "custom";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const catalogService = catalog.find((service) => service.id === selectedId);
    const service = isCustom ? { id: item?.id ?? "custom", name, price: Number(price) } : catalogService;
    if (!service) return setError("Vui lòng chọn một dịch vụ.");
    const nextError = onSubmit(service, note.trim());
    if (nextError) setError(nextError);
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop><Modal.Container size="md" placement="center"><Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
        <Modal.CloseTrigger className="rounded-lg" />
        <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4"><span className="grid size-9 place-items-center rounded-lg bg-admin-soft text-admin-accent"><PlusIcon className="size-5" /></span><Modal.Heading className="text-lg font-bold text-admin-ink">{item ? "Sửa dịch vụ phát sinh" : "Thêm dịch vụ phát sinh"}</Modal.Heading></Modal.Header>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {!item ? <div className="block text-sm font-semibold text-admin-ink">Nguồn dịch vụ<AdminSelectField label="Nguồn dịch vụ" fullWidth className="mt-2" value={selectedId} onChange={(value) => { setSelectedId(value); const service = catalog.find((entry) => entry.id === value); if (service) { setName(service.name); setPrice(String(service.price)); } }} options={[{ value: "custom", label: "Khoản tùy chỉnh" }, ...catalog.map((service) => ({ value: service.id, label: service.name }))]} /></div> : null}
          <label className="block text-sm font-semibold text-admin-ink">Tên dịch vụ<input className={`${fieldClassName} mt-2`} value={name} onChange={(event) => setName(event.target.value)} disabled={!isCustom} maxLength={80} required /></label>
          <label className="block text-sm font-semibold text-admin-ink">Giá (¥)<input className={`${fieldClassName} mt-2`} type="number" min="0" step="1" value={price} onChange={(event) => setPrice(event.target.value)} disabled={!isCustom} required /></label>
          <label className="block text-sm font-semibold text-admin-ink">Ghi chú<textarea className={`${fieldClassName} mt-2 min-h-20 py-2`} value={note} onChange={(event) => setNote(event.target.value)} maxLength={160} /></label>
          {error ? <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">{error}</p> : null}
        </Modal.Body><Modal.Footer className="border-t border-admin-border px-5 py-4"><Button type="button" variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>Đóng</Button><Button type="submit" variant="primary" className="rounded-lg">{item ? "Lưu thay đổi" : "Thêm dịch vụ"}</Button></Modal.Footer></form>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  );
}
