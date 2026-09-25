"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { adminService, ApiClientError } from "@/service";
import type { BranchRow } from "./data";

/** The translated reason for a refused delete, keyed by the API's stable error codes. */
export function branchDeleteErrorKey(error: unknown): "openAppointments" | "activeStaff" | null {
  if (!(error instanceof ApiClientError)) return null;
  if (error.code === "RESOURCE_HAS_OPEN_APPOINTMENTS") return "openAppointments";
  if (error.code === "BRANCH_HAS_ACTIVE_STAFF") return "activeStaff";
  return null;
}

export function BranchDeleteModal({
  branch,
  onClose,
  onDeleted,
}: Readonly<{
  branch: BranchRow;
  onClose: () => void;
  onDeleted: () => void;
}>) {
  const t = useTranslations("admin.branches.deleteDialog");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.deleteBranch(branch.id, branch.version);
      notifySuccess(t("success", { name: branch.name }));
      onDeleted();
      onClose();
    } catch (thrown) {
      const key = branchDeleteErrorKey(thrown);
      setError(key ? t(key) : thrown instanceof Error && thrown.message ? thrown.message : t("failed"));
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
                <Modal.Heading className="text-base font-bold text-admin-ink">{t("title")}</Modal.Heading>
                <p className="mt-0.5 text-xs text-admin-muted">{branch.name}</p>
              </div>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-5 text-sm">
              <p className="leading-6 text-admin-ink">{t("confirm", { name: branch.name })}</p>
              <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">
                {t("hint")}
              </p>
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>
                {t("cancel")}
              </Button>
              <Button
                variant="ghost"
                className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90"
                isDisabled={busy}
                onPress={() => void remove()}
              >
                {busy ? t("deleting") : t("action")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
