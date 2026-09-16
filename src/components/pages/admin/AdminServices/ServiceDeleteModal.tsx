"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { adminService, ApiClientError } from "@/service";
import type { SalonService } from "./data";

export function serviceDeleteErrorDetails(error: ApiClientError): string {
  return [error.message, error.code, error.status ? `HTTP ${error.status}` : null, error.requestId ? `requestId: ${error.requestId}` : null]
    .filter(Boolean)
    .join(" · ");
}

export function ServiceDeleteModal({
  service,
  onClose,
  onDeleted,
}: Readonly<{
  service: SalonService;
  onClose: () => void;
  onDeleted: () => void;
}>) {
  const t = useTranslations("admin.services");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (busy || service.version === undefined) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.deleteService(service.id, service.version);
      notifySuccess(t("delete.success", { name: service.name }));
      onDeleted();
      onClose();
    } catch (thrown) {
      setError(
        thrown instanceof ApiClientError && thrown.code === "SERVICE_HAS_BOOKING_HISTORY"
          ? t("delete.hasHistory")
          : thrown instanceof ApiClientError
            ? t("delete.failedWithDetails", { details: serviceDeleteErrorDetails(thrown) })
            : t("delete.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

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
                <Modal.Heading className="text-base font-bold text-admin-ink">
                  {t("delete.title")}
                </Modal.Heading>
                <p className="mt-0.5 text-xs text-admin-muted">{service.name}</p>
              </div>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-5 text-sm">
              <p className="leading-6 text-admin-ink">{t("delete.confirm", { name: service.name })}</p>
              <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">
                {t("delete.historyHint")}
              </p>
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>
                {t("delete.cancel")}
              </Button>
              <Button
                variant="ghost"
                className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90"
                isDisabled={busy || service.version === undefined}
                onPress={() => void remove()}
              >
                {busy ? t("delete.deleting") : t("delete.action")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
