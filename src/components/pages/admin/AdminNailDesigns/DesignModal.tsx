"use client";

import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { adminService } from "@/service";
import type { DesignRow } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";
const statusOptions = ["DRAFT", "PUBLISHED", "ARCHIVED", "HIDDEN"];

export function DesignModal({
  design,
  onClose,
  onSaved,
}: Readonly<{
  design: DesignRow | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.nailDesigns");
  // Status codes come from the API. t.has() keeps an unrecognised one rendering as
  // its raw code instead of throwing, which is what the old map did with ?? code.
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;
  const isEdit = design !== null;
  const [name, setName] = useState(design?.title ?? "");
  const [status, setStatus] = useState(design?.status ?? "DRAFT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isEdit && design) {
        await adminService.updateNailDesign(
          design.id,
          // The backend names this `title`; `name` was never read, so the
          // request failed validation with an empty title every time.
          // Publishing additionally needs explicit consent.
          {
            title: name.trim(),
            status,
            ...(status === "PUBLISHED" ? { consentToPublish: true } : {}),
          },
          design.version,
        );
      } else {
        await adminService.createNailDesign({
          title: name.trim(),
          status,
          ...(status === "PUBLISHED" ? { consentToPublish: true } : {}),
        });
      }
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
                <span className="font-semibold text-admin-ink">{t("modal.name")}</span>
                <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("modal.namePlaceholder")} autoFocus />
              </label>
              {/*
                No image URL field: the endpoint stores media as mediaIds from
                the upload flow and never reads a URL, so anything typed here
                was discarded on save.
              */}
              <div className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("modal.status")}</span>
                <AdminSelectField
                  label={t("modal.statusLabel")}
                  fullWidth
                  value={status}
                  onChange={setStatus}
                  options={statusOptions.map((code) => ({ value: code, label: statusLabel(code) }))}
                />
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
