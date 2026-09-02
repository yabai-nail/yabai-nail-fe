"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";

// Staff creation carries a `branchId` because staff records are branch-
// scoped even though the admin `staff` list is org-level. Adding a
// technician always attaches them to the branch the admin is currently
// operating on.
export function StaffCreateModal({
  branchId,
  onClose,
  onCreated,
}: Readonly<{
  branchId: string;
  onClose: () => void;
  onCreated: () => void;
}>) {
  const t = useTranslations("admin.staff");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.createStaff({
        displayName: name.trim(),
        branchId,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("create.failed"));
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
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("create.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("create.name")}</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Mai Linh"
                  autoFocus
                />
              </label>
              <p className="text-xs text-admin-muted">
                Kỹ năng, mức hoa hồng và ca làm việc có thể cấu hình sau khi tạo.
              </p>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>{t("create.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canSubmit}
                onPress={() => void submit()}
              >
                {busy ? t("create.saving") : t("create.submit")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
