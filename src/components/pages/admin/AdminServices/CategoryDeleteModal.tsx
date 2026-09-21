"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { adminService, ApiClientError, type AdminServiceCategory } from "@/service";

export function CategoryDeleteModal({
  category,
  serviceCount,
  onClose,
  onDeleted,
}: Readonly<{
  category: AdminServiceCategory;
  serviceCount: number;
  onClose: () => void;
  onDeleted: () => void;
}>) {
  const t = useTranslations("admin.services.categoryDelete");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = serviceCount > 0;

  const remove = async () => {
    if (busy || blocked) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.deleteServiceCategory(category.id, category.version);
      notifySuccess(t("success", { name: category.nameVi ?? category.name }));
      onDeleted();
      onClose();
    } catch (thrown) {
      setError(
        thrown instanceof ApiClientError && thrown.status === 409
          ? t("hasServicesServer")
          : thrown instanceof Error && thrown.message
            ? t("failedWithDetails", { details: thrown.message })
            : t("failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const displayName = category.nameVi ?? category.name;
  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog>
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-admin-soft text-admin-danger">
                <ExclamationTriangleIcon aria-hidden className="size-5" />
              </span>
              <div>
                <Modal.Heading className="text-base font-bold text-admin-ink">{t("title")}</Modal.Heading>
                <p className="mt-0.5 text-xs text-admin-muted">{displayName}</p>
              </div>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-5 text-sm">
              {blocked ? (
                <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 leading-5 text-admin-ink">
                  {t("hasServices", { count: serviceCount })}
                </p>
              ) : (
                <p className="leading-6 text-admin-ink">{t("confirm", { name: displayName })}</p>
              )}
              <p className="text-xs leading-5 text-admin-muted">{t("hint")}</p>
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("cancel")}</Button>
              <Button variant="ghost" className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90" isDisabled={busy || blocked} onPress={() => void remove()}>
                {busy ? t("deleting") : t("action")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
