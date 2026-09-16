"use client";

import { Button, Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { authService } from "@/service";

const inputClass = "min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

export function AccountSecuritySettings() {
  const t = useTranslations("admin.settings.account");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strongPassword = newPassword.length >= 8 && newPassword.length <= 128 && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) && /\d/.test(newPassword);
  const canSubmit = currentPassword.length > 0 && strongPassword && newPassword === confirmation && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await authService.changeAdminPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      notifySuccess(t("success"));
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t("failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card id="account" className="mt-4 max-w-2xl gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="border-b border-admin-border px-5 py-4">
        <div>
          <h2 className="font-bold text-admin-ink">{t("heading")}</h2>
          <p className="mt-1 text-xs text-admin-muted">{t("description")}</p>
        </div>
      </Card.Header>
      <Card.Content className="grid gap-4 p-5">
        <PasswordField id="current-password" label={t("currentPassword")} value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
        <PasswordField id="new-password" label={t("newPassword")} value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
        <PasswordField id="confirm-password" label={t("confirmation")} value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
        {newPassword && !strongPassword ? <p className="text-xs text-admin-danger">{t("requirements")}</p> : null}
        {confirmation && confirmation !== newPassword ? <p className="text-xs text-admin-danger">{t("mismatch")}</p> : null}
        {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
        <div>
          <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
            {busy ? t("saving") : t("save")}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete }: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}>) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-semibold text-admin-ink">
      {label}
      <input id={id} type="password" className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} />
    </label>
  );
}
