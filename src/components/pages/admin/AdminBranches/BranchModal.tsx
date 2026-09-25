"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { API_BASE_URL, adminMediaService, adminService } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import type { BranchRow } from "./data";
import { initialBranchTimeZone } from "./branch-timezone";
import { BranchImageField } from "./BranchImageField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { mediaIdFromPublicUrl, useAvatarField } from "@/components/blocks/admin/AdminAvatarField";

const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
const statusOptions = ["ACTIVE", "INACTIVE"];

export function BranchModal({
  branch,
  onClose,
  onSaved,
}: Readonly<{
  branch: BranchRow | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.branches");
  const tc = useTranslations("admin.common");
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;
  const isEdit = branch !== null;
  const [name, setName] = useState(branch?.name ?? "");
  const [address, setAddress] = useState(branch?.address ?? "");
  const [timezone, setTimezone] = useState(() => initialBranchTimeZone(branch));
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(branch?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const image = useAvatarField(branch?.imageUrl);

  const canSubmit = name.trim().length >= 2 && address.trim().length >= 2 && !image.blocked && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    let uploadedMediaId: string | null = null;
    try {
      const resolved = await image.resolve();
      uploadedMediaId = resolved.uploadedMediaId;
      // The shared picker speaks `avatarMediaId`; the branch API calls the same contract `imageMediaId`.
      const imagePatch = "avatarMediaId" in resolved.patch ? { imageMediaId: resolved.patch.avatarMediaId } : {};
      if (isEdit && branch) {
        await adminService.updateBranch(
          branch.id,
          { name: name.trim(), address: address.trim(), timeZone: timezone, status, ...imagePatch },
          branch.version,
        );
        // The previous photo is now an orphan. Best-effort: the save has already succeeded.
        if (image.mode !== "keep") {
          const previous = mediaIdFromPublicUrl(branch.imageUrl, API_BASE_URL);
          if (previous) {
            try {
              await adminMediaService.deleteMedia(previous);
            } catch {
              // Cleanup is best-effort; the sweep can catch it later.
            }
          }
        }
      } else {
        await adminService.createBranch({
          name: name.trim(),
          address: address.trim(),
          timezone,
          ...imagePatch,
        });
      }
      notifySuccess(isEdit ? tc("branchUpdated") : tc("branchCreated"));
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
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {isEdit ? t("modal.editTitle") : t("add")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <BranchImageField field={image} name={name} busy={busy} />
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("detail.name")}</span>
                <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("modal.namePlaceholder")} autoFocus />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("columns.address")}</span>
                <input className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} placeholder={t("modal.addressPlaceholder")} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                {isEdit ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-admin-ink">{t("columns.status")}</span>
                    <AdminSelectField
                      label={t("modal.statusLabel")}
                      fullWidth
                      value={status}
                      onChange={(value) => setStatus(value as "ACTIVE" | "INACTIVE")}
                      options={statusOptions.map((code) => ({ value: code, label: statusLabel(code) }))}
                    />
                  </div>
                ) : null}
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("detail.timezone")}</span>
                  <input className={inputClass} value={timezone} onChange={(event) => setTimezone(event.target.value)} />
                </label>
              </div>
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
