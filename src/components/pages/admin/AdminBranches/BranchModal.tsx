"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import { branchStatusLabels, type BranchRow } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
const statusOptions = ["ACTIVE", "INACTIVE"];

export function BranchModal({
  branch,
  onClose,
  onSaved,
}: Readonly<{
  branch: BranchRow | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const isEdit = branch !== null;
  const [name, setName] = useState(branch?.name ?? "");
  const [address, setAddress] = useState(branch?.address ?? "");
  const [timezone, setTimezone] = useState(branch?.timezone ?? "Asia/Ho_Chi_Minh");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(branch?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && address.trim().length >= 2 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isEdit && branch) {
        await adminService.updateBranch(
          branch.id,
          { name: name.trim(), address: address.trim(), timeZone: timezone, status },
          branch.version,
        );
      } else {
        await adminService.createBranch({
          name: name.trim(),
          address: address.trim(),
          timezone,
        });
      }
      notifySuccess(isEdit ? "Đã cập nhật chi nhánh" : "Đã thêm chi nhánh");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không lưu được chi nhánh.");
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
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {isEdit ? "Sửa chi nhánh" : "Thêm chi nhánh"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Tên chi nhánh</span>
                <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="YABAI NAIL Quận 1" autoFocus />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Địa chỉ</span>
                <input className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="45 Lê Lợi, Quận 1" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                {isEdit ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">Trạng thái</span>
                    <AdminSelectField
                      label="Trạng thái chi nhánh"
                      fullWidth
                      value={status}
                      onChange={(value) => setStatus(value as "ACTIVE" | "INACTIVE")}
                      options={statusOptions.map((code) => ({ value: code, label: branchStatusLabels[code] ?? code }))}
                    />
                  </div>
                ) : null}
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">Múi giờ</span>
                  <input className={inputClass} value={timezone} onChange={(event) => setTimezone(event.target.value)} />
                </label>
              </div>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Hủy</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
                {busy ? "Đang lưu…" : isEdit ? "Lưu" : "Thêm"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
