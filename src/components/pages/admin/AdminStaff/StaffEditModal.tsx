"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { adminService, useAdminBranch, useAuth, type AdminBranch } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import type { StaffMember } from "./data";

// Small modal for the base staff row: displayName, branch and active. Skills /
// shifts / compensation each have their own surface.
export function StaffEditModal({
  member,
  branches,
  onClose,
  onSaved,
}: Readonly<{
  member: StaffMember;
  /** The admin branch list the page already holds; the modal never fetches its own. */
  branches: ReadonlyArray<AdminBranch>;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.staff");
  const tc = useTranslations("admin.common");
  const { branchIds } = useAdminBranch();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(member.name);
  const [branchId, setBranchId] = useState(member.branchId);
  const [active, setActive] = useState(member.status === "working");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only branches this admin may assign to, mirroring the API's own scope rule: an owner may
  // assign anywhere in the chain (and is stored with an empty branchIds on purpose, so that
  // list must not be used as their scope), while a manager's scope is exactly branchIds. The
  // API refuses anything else with a 403, so nobody is offered a branch only to be told no.
  const isOwner = user?.role === "OWNER";
  const branchOptions = useMemo(
    () =>
      branches
        .filter((branch) => branch.active !== false && (isOwner || branchIds.includes(branch.id)))
        .map((branch) => ({ value: branch.id, label: branch.name })),
    [branches, branchIds, isOwner],
  );

  const canSubmit = displayName.trim().length > 0 && branchId !== "" && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.updateStaff(
        member.id,
        {
          displayName: displayName.trim(),
          status: active ? "ACTIVE" : "INACTIVE",
          // Sent only when it changed: the API treats a branch move as a transfer and refuses
          // it while the staff member still has open appointments, and that refusal must not
          // fire on a save that only renamed someone.
          ...(branchId !== member.branchId ? { branchId } : {}),
        },
        member.version,
      );
      // The list behind the modal is filtered to the current branch, so a moved staff member
      // vanishes from it the moment this succeeds. Say where they went, or the move reads as
      // a deletion.
      const movedTo = branchId !== member.branchId
        ? branchOptions.find((option) => option.value === branchId)?.label
        : undefined;
      notifySuccess(movedTo ? t("edit.movedTo", { branch: movedTo }) : tc("staffUpdated"));
      onSaved();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : t("edit.failed"));
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
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("edit.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("edit.name")}</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              <div className="flex flex-col gap-1">
                <span id="staff-edit-branch-label" className="text-xs font-semibold text-admin-ink">{t("edit.branch")}</span>
                <AdminSelectField
                  id="staff-edit-branch"
                  label={t("edit.branch")}
                  fullWidth
                  value={branchId}
                  onChange={setBranchId}
                  options={branchOptions}
                  isDisabled={busy || branchOptions.length === 0}
                  describedBy="staff-edit-branch-hint"
                />
                {/* Said up front rather than as a 409 after the fact: moving someone is a
                    transfer, and the API keeps their open appointments where they are. */}
                <span id="staff-edit-branch-hint" className="text-xs text-admin-muted">{t("edit.branchHint")}</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-admin-ink">
                <input
                  type="checkbox" className="accent-admin-accent"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
                {t("edit.active")}
              </label>
              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>{t("edit.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={!canSubmit}
              >
                {busy ? t("edit.saving") : t("edit.save")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
