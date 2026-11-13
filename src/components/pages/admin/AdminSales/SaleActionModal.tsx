"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { isVersionConflict } from "@/components/pages/admin/AdminMarketing/home-announcements";
import { notifySuccess } from "@/lib/app-toast";
import { adminService, ApiClientError, type AdminSale } from "@/service";

export type SaleAction = "end" | "delete";

/**
 * Asks before "Kết thúc ngay" or "Xoá". Ending an upcoming sale cancels it, and the copy says
 * so; a sale that ended meanwhile reloads the list instead of failing silently.
 */
export function SaleActionModal({
  sale,
  action,
  onClose,
  onDone,
}: Readonly<{ sale: AdminSale; action: SaleAction; onClose: () => void; onDone: () => void }>) {
  const t = useTranslations("admin.sales");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upcoming = sale.status === "UPCOMING";

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "end") {
        await adminService.endSale(sale.id, sale.version);
        notifySuccess(t("end.success", { name: sale.name }));
      } else {
        await adminService.deleteSale(sale.id, sale.version);
        notifySuccess(t("delete.success", { name: sale.name }));
      }
      onDone();
      onClose();
    } catch (thrown) {
      const alreadyEnded = thrown instanceof ApiClientError && thrown.code === "SALE_ALREADY_ENDED";
      // Changed in another tab: reload, so a retry carries the fresh version.
      const conflict = isVersionConflict(thrown);
      if (alreadyEnded || conflict) onDone();
      setError(
        alreadyEnded ? t("end.alreadyEnded") : conflict ? t("conflict") : action === "end" ? t("end.failed") : t("delete.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const copy = action === "end"
    ? {
        title: t("end.title"),
        confirm: upcoming ? t("end.confirmUpcoming", { name: sale.name }) : t("end.confirmActive", { name: sale.name }),
        hint: upcoming ? t("end.hintUpcoming") : t("end.hintActive"),
        back: t("end.back"),
        submit: busy ? t("end.ending") : t("end.action"),
      }
    : {
        title: t("delete.title"),
        confirm: t("delete.confirm", { name: sale.name }),
        // Ending is the gentler choice only while the sale has not ended yet.
        hint: sale.status === "ENDED" ? null : t("delete.hint"),
        back: t("delete.back"),
        submit: busy ? t("delete.deleting") : t("delete.action"),
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
                <Modal.Heading className="text-base font-bold text-admin-ink">{copy.title}</Modal.Heading>
                <p className="mt-0.5 text-xs text-admin-muted">{sale.name}</p>
              </div>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-5 text-sm">
              <p className="leading-6 text-admin-ink">{copy.confirm}</p>
              {copy.hint ? (
                <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">{copy.hint}</p>
              ) : null}
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{copy.back}</Button>
              <Button
                variant="ghost"
                className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90"
                isDisabled={busy}
                onPress={() => void run()}
              >
                {copy.submit}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
