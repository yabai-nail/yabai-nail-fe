"use client";

import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { adminService, type AdminStaffMember } from "@/service";
import type { AccountRow } from "./data";

/**
 * Links a login to a roster profile, or unlinks the one it has. Until now the link could only
 * be set when the profile was created, and a STAFF login without one cannot sign in at all,
 * so this is the repair path for every technician whose account was made separately.
 */
export function LinkStaffModal({
  account,
  linked,
  candidates,
  onClose,
  onDone,
}: Readonly<{
  account: AccountRow;
  /** The profile this login is linked to now, if any. */
  linked: AdminStaffMember | null;
  /** Profiles no login points at yet. */
  candidates: ReadonlyArray<AdminStaffMember>;
  onClose: () => void;
  onDone: () => void;
}>) {
  const t = useTranslations("admin.accounts.linkModal");
  const [staffId, setStaffId] = useState(candidates[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const link = async () => {
    const target = candidates.find((member) => member.id === staffId);
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.updateStaff(target.id, { accountId: account.id }, target.version);
      notifySuccess(t("linked", { name: account.displayName, staff: target.displayName }));
      onDone();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error && thrown.message ? thrown.message : t("failed"));
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (!linked || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.updateStaff(linked.id, { accountId: null }, linked.version);
      notifySuccess(t("unlinked", { name: account.displayName }));
      onDone();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error && thrown.message ? thrown.message : t("failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("title", { name: account.displayName })}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              {linked ? (
                <>
                  <p className="text-admin-ink">{t("currentlyLinked", { staff: linked.displayName })}</p>
                  <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs text-admin-muted">{t("unlinkHint")}</p>
                </>
              ) : candidates.length === 0 ? (
                <p className="text-admin-muted">{t("noneAvailable")}</p>
              ) : (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("staff")}</span>
                  <select value={staffId} onChange={(event) => setStaffId(event.target.value)} className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink">
                    {candidates.map((member) => (
                      <option key={member.id} value={member.id}>{member.displayName}</option>
                    ))}
                  </select>
                  <span className="text-xs text-admin-muted">{t("linkHint")}</span>
                </label>
              )}
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("cancel")}</Button>
              {linked ? (
                <Button variant="ghost" className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90" isDisabled={busy} onPress={() => void unlink()}>
                  {busy ? t("working") : t("unlink")}
                </Button>
              ) : (
                <Button variant="primary" className="rounded-lg" isDisabled={busy || !staffId} onPress={() => void link()}>
                  {busy ? t("working") : t("link")}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
