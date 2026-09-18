"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService, useAdminBranchList } from "@/service";
import { isAdminPhone, isStrongTemporaryPassword } from "@/lib/admin-credentials";
import { notifySuccess } from "@/lib/app-toast";
import type { AccountRow } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
const roleOptions = ["STAFF", "MANAGER", "OWNER"];
const statusOptions = ["ACTIVE", "SUSPENDED", "DISABLED"];

export function AccountModal({
  account,
  onClose,
  onSaved,
}: Readonly<{
  account: AccountRow | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.accounts");
  const tc = useTranslations("admin.common");
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;
  const roleLabel = (code: string) =>
    t.has(`role.${code}`) ? t(`role.${code}`) : code;
  const isEdit = account !== null;
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [role, setRole] = useState(account?.role ?? "STAFF");
  const [status, setStatus] = useState(account?.status ?? "ACTIVE");
  const [password, setPassword] = useState("");
  const [branchIds, setBranchIds] = useState<ReadonlyArray<string>>(account?.branchIds ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const temporaryPassword = password.trim();
  const branches = useAdminBranchList();
  const requiresBranch = role === "STAFF" || role === "MANAGER";
  const canSubmit =
    displayName.trim().length >= 2 &&
    (!requiresBranch || branchIds.length > 0) &&
    (isEdit || (isAdminPhone(phone) && isStrongTemporaryPassword(password))) &&
    !busy;

  const toggleBranch = (branchId: string) => {
    setBranchIds((current) =>
      current.includes(branchId)
        ? current.filter((id) => id !== branchId)
        : [...current, branchId],
    );
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isEdit && account) {
        await adminService.updateAccount(
          account.id,
          { displayName: displayName.trim(), role, status, branchIds: role === "OWNER" ? [] : branchIds },
          account.version,
        );
      } else {
        await adminService.createAccount({
          phone: phone.trim(),
          displayName: displayName.trim(),
          role,
          branchIds: role === "OWNER" ? [] : branchIds,
          temporaryPassword,
        });
      }
      notifySuccess(isEdit ? tc("accountUpdated") : tc("accountCreated"));
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("modal.saveFailed"));
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
                {isEdit ? t("modal.editTitle") : t("modal.addTitle")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("modal.phone")}</span>
                <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0900000010" disabled={isEdit} inputMode="numeric" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("modal.displayName")}</span>
                <input className={inputClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t("modal.displayNamePlaceholder")} autoFocus />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("columns.role")}</span>
                  <AdminSelectField
                    label={t("columns.role")}
                    fullWidth
                    value={role}
                    onChange={setRole}
                    options={roleOptions.map((code) => ({ value: code, label: roleLabel(code) }))}
                  />
                </div>
                {isEdit ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">{t("columns.status")}</span>
                    <AdminSelectField
                      label={t("modal.statusLabel")}
                      fullWidth
                      value={status}
                      onChange={setStatus}
                      options={statusOptions.map((code) => ({ value: code, label: statusLabel(code) }))}
                    />
                  </div>
                ) : (
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">{t("modal.tempPassword")}</span>
                    <input type="password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("modal.tempPasswordPlaceholder")} />
                  </label>
                )}
              </div>
              {requiresBranch ? (
                <fieldset className="rounded-lg border border-admin-border p-3">
                  <legend className="px-1 text-sm font-semibold text-admin-ink">{t("modal.branches")}</legend>
                  {branches.isLoading ? (
                    <p className="text-xs text-admin-muted">{t("modal.branchesLoading")}</p>
                  ) : branches.error ? (
                    <p role="alert" className="text-xs text-admin-danger">{t("modal.branchesLoadFailed")}</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(branches.data?.items ?? []).map((branch) => (
                        <label key={branch.id} className="flex min-h-10 items-center gap-2 rounded-lg border border-admin-border px-3 text-sm text-admin-ink">
                          <input
                            type="checkbox"
                            className="accent-admin-accent"
                            checked={branchIds.includes(branch.id)}
                            onChange={() => toggleBranch(branch.id)}
                          />
                          <span>{branch.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {branchIds.length === 0 ? <p className="mt-2 text-xs text-admin-danger">{t("modal.branchRequired")}</p> : null}
                </fieldset>
              ) : null}
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>{t("modal.cancel")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
                {busy ? t("modal.saving") : isEdit ? t("modal.save") : t("modal.add")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
