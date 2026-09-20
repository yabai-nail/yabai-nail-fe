"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { API_BASE_URL, adminMediaService, adminService, useAdminBranchList } from "@/service";
import { isAdminPhone, isStrongTemporaryPassword } from "@/lib/admin-credentials";
import { notifySuccess } from "@/lib/app-toast";
import type { AccountRow } from "./data";
import { AdminAvatarField, mediaIdFromPublicUrl, useAvatarField } from "@/components/blocks/admin/AdminAvatarField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

const inputClass = "min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
const roleOptions = ["CUSTOMER", "STAFF", "MANAGER", "OWNER"];
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
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [locale, setLocale] = useState<"vi" | "ja">("vi");
  const [branchIds, setBranchIds] = useState<ReadonlyArray<string>>(account?.branchIds ?? []);
  const avatar = useAvatarField(account?.avatarUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const temporaryPassword = password.trim();
  const branches = useAdminBranchList();
  const isCustomer = role === "CUSTOMER";
  const requiresBranch = role === "STAFF" || role === "MANAGER" || isCustomer;
  const customerCredentialsValid =
    !isCustomer ||
    (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && /^[a-zA-Z0-9_.]{3,60}$/.test(username.trim()));
  const canSubmit =
    displayName.trim().length >= 2 &&
    (!requiresBranch || branchIds.length > 0) &&
    // Phone is now editable on both create and edit; the temporary password is only required at create.
    isAdminPhone(phone) &&
    customerCredentialsValid &&
    (isEdit || isStrongTemporaryPassword(password)) &&
    !avatar.blocked &&
    !busy;

  const toggleBranch = (branchId: string) => {
    if (isCustomer) {
      setBranchIds([branchId]);
      return;
    }
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
    let uploadedMediaId: string | null = null;
    try {
      if (!isEdit && isCustomer) {
        await adminService.createCustomer(branchIds[0], {
          phone: phone.trim(),
          displayName: displayName.trim(),
          email: email.trim().toLocaleLowerCase(),
          username: username.trim(),
          temporaryPassword,
          locale,
        });
        notifySuccess(tc("accountCreated"));
        onSaved();
        onClose();
        return;
      }
      const resolved = await avatar.resolve();
      uploadedMediaId = resolved.uploadedMediaId;
      if (isEdit && account) {
        await adminService.updateAccount(
          account.id,
          { displayName: displayName.trim(), phone: phone.trim(), role, status, branchIds: role === "OWNER" ? [] : branchIds, ...resolved.patch },
          account.version,
        );
        // The old photo is now unreferenced when it was replaced or removed. Best-effort cleanup;
        // the account save has already landed.
        if (avatar.mode !== "keep") {
          const previous = mediaIdFromPublicUrl(account.avatarUrl, API_BASE_URL);
          if (previous) {
            try {
              await adminMediaService.deleteMedia(previous);
            } catch {
              // Cleanup is best-effort; the sweep can catch it later.
            }
          }
        }
      } else {
        await adminService.createAccount({
          phone: phone.trim(),
          displayName: displayName.trim(),
          role,
          branchIds: role === "OWNER" ? [] : branchIds,
          temporaryPassword,
          ...resolved.patch,
        });
      }
      notifySuccess(isEdit ? tc("accountUpdated") : tc("accountCreated"));
      onSaved();
      onClose();
    } catch (err) {
      if (uploadedMediaId) {
        try {
          await adminMediaService.deleteMedia(uploadedMediaId);
        } catch {
          // Keep the actionable save error; the orphan upload can be swept up later.
        }
      }
      setError(err instanceof Error && err.message ? err.message : t("modal.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        {/* HeroUI caps "lg" at 32rem; the utility class on the dialog wins over that, so the
            form gets room for two columns instead of a tall single one. */}
        <Modal.Container size="lg" placement="center" scroll="inside">
          <Modal.Dialog className="max-w-4xl">
            <Modal.Header className="border-b border-admin-border px-6 py-4">
              <Modal.Heading className="text-lg font-bold text-admin-ink">
                {isEdit ? t("modal.editTitle") : t("modal.addTitle")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-5 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("modal.phone")}</span>
                  <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0900000010" inputMode="numeric" />
                  {phone && !isAdminPhone(phone) ? <span className="text-xs text-admin-danger">{t("modal.phoneInvalid")}</span> : null}
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("modal.displayName")}</span>
                  <input className={inputClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t("modal.displayNamePlaceholder")} autoFocus />
                </label>
              </div>
              {isCustomer ? null : <AdminAvatarField field={avatar} name={displayName} busy={busy} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("columns.role")}</span>
                  <AdminSelectField
                    label={t("columns.role")}
                    fullWidth
                    value={role}
                    onChange={setRole}
                    options={(isEdit ? roleOptions.filter((code) => code !== "CUSTOMER") : roleOptions).map((code) => ({ value: code, label: roleLabel(code) }))}
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
              {isCustomer ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">{t("modal.email")}</span>
                    <input type="email" autoCapitalize="none" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@example.com" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">{t("modal.username")}</span>
                    <input autoCapitalize="none" className={inputClass} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="customer.name" />
                  </label>
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">{t("modal.locale")}</span>
                    <AdminSelectField
                      label={t("modal.locale")}
                      fullWidth
                      value={locale}
                      onChange={(value) => setLocale(value === "ja" ? "ja" : "vi")}
                      options={[{ value: "vi", label: t("modal.localeVi") }, { value: "ja", label: t("modal.localeJa") }]}
                    />
                  </div>
                  {!customerCredentialsValid ? <p role="alert" className="text-xs text-admin-danger sm:col-span-3">{t("modal.customerCredentialsInvalid")}</p> : null}
                </div>
              ) : null}
              {requiresBranch ? (
                <fieldset className="rounded-lg border border-admin-border p-3">
                  <legend className="px-1 text-sm font-semibold text-admin-ink">{t(isCustomer ? "modal.customerBranch" : "modal.branches")}</legend>
                  {branches.isLoading ? (
                    <p className="text-xs text-admin-muted">{t("modal.branchesLoading")}</p>
                  ) : branches.error ? (
                    <p role="alert" className="text-xs text-admin-danger">{t("modal.branchesLoadFailed")}</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {(branches.data?.items ?? []).map((branch) => (
                        <label key={branch.id} className="flex min-h-10 items-center gap-2 rounded-lg border border-admin-border px-3 text-sm text-admin-ink">
                          <input
                            type={isCustomer ? "radio" : "checkbox"}
                            name={isCustomer ? "customerBranch" : undefined}
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
