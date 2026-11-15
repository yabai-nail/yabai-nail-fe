"use client";

import { ExclamationTriangleIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { adminService } from "@/service";
import { staffDeleteRefusal, type StaffMember } from "./data";

/**
 * Owner-only hard delete. The API decides: a technician with no record at all is removed with
 * their shifts and configuration; anyone with appointments, commissions or payroll is refused,
 * and this dialog then turns into the answer the business wants — deactivate, which hides them
 * and disables their login while every report keeps their name.
 */
export function StaffDeleteModal({
  member,
  onClose,
  onDeleted,
  onDeactivate,
}: Readonly<{
  member: StaffMember;
  onClose: () => void;
  onDeleted: () => void;
  /** Offered when the API refuses a working member because of history. */
  onDeactivate: () => void;
}>) {
  const t = useTranslations("admin.staff.delete");
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<"hasHistory" | "openAppointments" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.deleteStaff(member.id, member.version);
      notifySuccess(t("success", { name: member.name }));
      onDeleted();
      onClose();
    } catch (thrown) {
      const known = staffDeleteRefusal(thrown);
      if (known) setRefusal(known);
      else setError(thrown instanceof Error && thrown.message ? thrown.message : t("failed"));
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
                  {refusal === "hasHistory" ? t("historyTitle") : t("title")}
                </Modal.Heading>
                <p className="mt-0.5 text-xs text-admin-muted">{member.name}</p>
              </div>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-5 text-sm">
              {refusal === "hasHistory" ? (
                <p className="leading-6 text-admin-ink">
                  {member.status === "working" ? t("hasHistory") : t("hasHistoryInactive")}
                </p>
              ) : refusal === "openAppointments" ? (
                <p role="alert" className="leading-6 text-admin-danger">{t("openAppointments")}</p>
              ) : (
                <>
                  <p className="leading-6 text-admin-ink">{t("confirm", { name: member.name })}</p>
                  <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">
                    {t("hint")}
                  </p>
                </>
              )}
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>
                {refusal ? t("close") : t("cancel")}
              </Button>
              {refusal === "hasHistory" && member.status === "working" ? (
                <Button variant="primary" className="rounded-lg" onPress={onDeactivate}>
                  <NoSymbolIcon className="size-4" />{t("deactivateInstead")}
                </Button>
              ) : refusal === null ? (
                <Button
                  variant="ghost"
                  className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90"
                  isDisabled={busy}
                  onPress={() => void remove()}
                >
                  {busy ? t("deleting") : t("action")}
                </Button>
              ) : null}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
