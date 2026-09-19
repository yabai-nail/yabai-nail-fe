"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService, useAdminPermission } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import { StaffBranchField, type StaffBranchOption } from "./StaffBranchField";
import { canCreateStaff } from "./data";

// A staff record is branch-scoped even though the roster that lists it is org-level, so this
// form has to name a branch. It opens on the one the console is working in and lets that be
// changed, because the header's branch switcher hides itself for an admin assigned a single
// branch — and without a choice here, every technician a chain owner added landed in the same
// salon whatever the intent.
export function StaffCreateModal({
  branchId,
  branches,
  onClose,
  onCreated,
}: Readonly<{
  branchId: string;
  branches: ReadonlyArray<StaffBranchOption>;
  onClose: () => void;
  onCreated: () => void;
}>) {
  const t = useTranslations("admin.staff");
  const tc = useTranslations("admin.common");
  const [name, setName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(branchId);
  // Issuing a login is owner-only: `POST /admin/accounts` requires `account.write.all`, which
  // the manager template does not carry, while `staff.write.branch` — the permission that
  // opened this form — does. Offering the checkbox to a manager would 403 on the first of the
  // two calls and leave them with no technician at all.
  const canIssueLogin = useAdminPermission("account.write.all");
  // A roster record and a login are two different things in the backend, and a technician who
  // never opens the console does not need the second. Checked by default because the common
  // case is a new hire who does: they have to see their own shifts.
  const [wantsAccount, setWantsAccount] = useState(true);
  const withAccount = canIssueLogin && wantsAccount;
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  // The account has to exist before the roster record, because `accountId` is only read when
  // a staff row is created — a PATCH cannot link one afterwards. So a failure on the second
  // call would leave an account behind, and a retry that created a second one would leave two.
  // Holding the id here means the retry reuses the account it already made.
  const [accountId, setAccountId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
  const canSubmit = canCreateStaff({ name, withAccount, phone, password }) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    let issuedAccountId = accountId;
    try {
      if (withAccount) {
        // Creating a STAFF account now provisions and links its roster profile on the backend
        // (mutateAccount), so this single call is the whole job. A separate createStaff would
        // link the same account again and leave two profiles on it.
        if (issuedAccountId === null) {
          const account = await adminService.createAccount({
            phone: phone.trim(),
            displayName: name.trim(),
            // Least privilege: a technician gets a technician's account. Promoting one to
            // manager is a deliberate act, and it lives on the accounts screen.
            role: "STAFF",
            branchIds: [selectedBranchId],
            temporaryPassword: password.trim(),
          });
          issuedAccountId = account.id;
          setAccountId(account.id);
        }
      } else {
        // A roster-only technician who never signs in: create the profile with no linked login.
        await adminService.createStaff({
          displayName: name.trim(),
          branchId: selectedBranchId,
        });
      }
      notifySuccess(tc("staffCreated"));
      onCreated();
      onClose();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : t("create.failed");
      // Naming the half that did land is the difference between a retry and a hunt through
      // the accounts screen for a login nobody remembers issuing.
      setError(
        issuedAccountId === null
          ? message
          : `${t("create.accountKept", { phone: phone.trim() })} ${message}`,
      );
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
                  className={inputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Mai Linh"
                  autoFocus
                />
              </label>

              {/* Locked once an account exists: its own `branchIds` was written with the branch
                  selected at the time, so letting a retry file the technician somewhere else
                  would leave the login assigned to a salon they do not work at. */}
              <StaffBranchField
                branches={branches}
                disabled={busy || accountId !== null}
                hint={t("create.branchHint")}
                label={t("create.branch")}
                onChange={setSelectedBranchId}
                value={selectedBranchId}
              />

              {canIssueLogin ? (
              <div className="grid gap-3 rounded-lg border border-admin-border p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-admin-accent"
                    checked={withAccount}
                    disabled={accountId !== null}
                    onChange={(event) => setWantsAccount(event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-admin-ink">{t("create.withAccount")}</span>
                    <span className="mt-1 block text-xs text-admin-muted">{t("create.withAccountHint")}</span>
                  </span>
                </label>

                {withAccount ? (
                  <>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-xs font-semibold text-admin-ink">{t("create.phone")}</span>
                      <input
                        className={inputClass}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="0900000010"
                        inputMode="numeric"
                        disabled={accountId !== null}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-xs font-semibold text-admin-ink">{t("create.password")}</span>
                      <input
                        type="password"
                        className={inputClass}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={accountId !== null}
                      />
                      <span className="text-xs text-admin-muted">{t("create.passwordHint")}</span>
                    </label>
                  </>
                ) : null}
              </div>
              ) : null}

              <p className="text-xs text-admin-muted">
                {t("create.afterCreateHint")}
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
