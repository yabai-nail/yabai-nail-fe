"use client";

import { Button, Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { API_BASE_URL, adminMediaService, authService, useAuth } from "@/service";
import { AdminAvatarField, mediaIdFromPublicUrl, useAvatarField } from "@/components/blocks/admin/AdminAvatarField";

const inputClass = "min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

// Lets any signed-in admin (owner/manager/staff) edit their OWN display name and photo. The
// backend endpoint keeps this to name + avatar; role, phone and status stay admin-only. On success
// it merges the result into the auth context so the header updates without a reload.
export function AccountProfileSettings() {
  const t = useTranslations("admin.settings.profile");
  const { user, applyProfileUpdate } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const avatar = useAvatarField(user?.avatarUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = displayName.trim();
  const nameValid = trimmed.length >= 2 && trimmed.length <= 80;
  const canSubmit = nameValid && !avatar.blocked && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    let uploadedMediaId: string | null = null;
    try {
      const resolved = await avatar.resolve();
      uploadedMediaId = resolved.uploadedMediaId;
      const updated = await authService.updateAdminProfile({ displayName: trimmed, ...resolved.patch });
      // Refresh the shell header (and anything else reading the auth user) in place.
      applyProfileUpdate(updated);
      // The photo that was there before is now unreferenced when it was replaced or removed.
      if (avatar.mode !== "keep") {
        const previous = mediaIdFromPublicUrl(user?.avatarUrl, API_BASE_URL);
        if (previous) {
          try {
            await adminMediaService.deleteMedia(previous);
          } catch {
            // Cleanup is best-effort; the save already succeeded.
          }
        }
      }
      notifySuccess(t("success"));
    } catch (cause) {
      if (uploadedMediaId) {
        try {
          await adminMediaService.deleteMedia(uploadedMediaId);
        } catch {
          // Keep the actionable save error; the orphan upload can be swept up later.
        }
      }
      setError(cause instanceof Error && cause.message ? cause.message : t("failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-4 max-w-2xl gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="border-b border-admin-border px-5 py-4">
        <div>
          <h2 className="font-bold text-admin-ink">{t("heading")}</h2>
          <p className="mt-1 text-xs text-admin-muted">{t("description")}</p>
        </div>
      </Card.Header>
      <Card.Content className="grid gap-4 p-5">
        <AdminAvatarField field={avatar} name={trimmed || (user?.displayName ?? "")} busy={busy} />
        <label htmlFor="profile-display-name" className="grid gap-2 text-sm font-semibold text-admin-ink">
          {t("displayName")}
          <input
            id="profile-display-name"
            className={inputClass}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
          />
        </label>
        {displayName && !nameValid ? <p className="text-xs text-admin-danger">{t("nameError")}</p> : null}
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
