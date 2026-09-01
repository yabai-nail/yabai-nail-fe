"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";
import { notifySuccess } from "@/lib/app-toast";

// Minimal create form. Server accepts a rich body (birthday, preferences,
// segment) — those live on the edit surface once it exists. For now the
// modal captures the two fields the salon needs to reach the customer
// (name + phone) so a walk-in can be added in seconds and enriched later
// from the detail panel.
export function CustomerCreateModal({
  branchId,
  onClose,
  onCreated,
}: Readonly<{
  branchId: string;
  onClose: () => void;
  onCreated: () => void;
}>) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && phone.trim().length >= 8 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.createCustomer(branchId, {
        displayName: name.trim(),
        phone: phone.trim(),
        note: note.trim() || undefined,
      });
      notifySuccess("Đã thêm khách hàng");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không tạo được khách hàng.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">Thêm khách hàng</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Họ và tên</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nguyễn Thu Hương"
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Số điện thoại</span>
                <input
                  type="tel"
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0901 234 567"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Ghi chú (tùy chọn)</span>
                <textarea
                  className="min-h-16 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  placeholder="Ví dụ: dị ứng sản phẩm nào đó, sở thích màu…"
                />
              </label>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Hủy</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canSubmit}
                onPress={() => void submit()}
              >
                {busy ? "Đang lưu…" : "Thêm khách hàng"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
