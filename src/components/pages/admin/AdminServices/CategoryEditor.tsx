"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import { adminService, type AdminServiceCategory } from "@/service";

// One modal for create + rename. When `category` is null it POSTs; otherwise
// it PATCHes with If-Match.
export function CategoryEditor({
  category,
  onClose,
  onSaved,
}: Readonly<{
  category: AdminServiceCategory | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const isEdit = category !== null;
  const [code, setCode] = useState(category?.code ?? "");
  const [name, setName] = useState(category?.name ?? "");
  const [nameVi, setNameVi] = useState(category?.nameVi ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = code.trim().length > 0 && name.trim().length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isEdit) {
        await adminService.updateServiceCategory(
          category.id,
          { code: code.trim(), name: name.trim(), nameVi: nameVi.trim() || undefined },
          category.version,
        );
      } else {
        await adminService.createServiceCategory({
          code: code.trim(),
          name: name.trim(),
          nameVi: nameVi.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không lưu được danh mục.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {isEdit ? "Đổi tên danh mục" : "Thêm danh mục"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Mã (code)</span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="GEL"
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Tên (nội bộ / EN)</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Gel manicure"
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Tên hiển thị (VI)</span>
                <input
                  value={nameVi}
                  onChange={(event) => setNameVi(event.target.value)}
                  placeholder="Sơn gel"
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>Huỷ</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={!canSubmit}
              >
                {busy ? "Đang lưu…" : isEdit ? "Lưu" : "Thêm"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
