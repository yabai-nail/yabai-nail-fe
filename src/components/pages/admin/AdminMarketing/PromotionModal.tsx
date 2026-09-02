"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import type { PromotionRow } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

const inputClass =
  "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";

export function PromotionModal({
  promotion,
  onClose,
  onSaved,
}: Readonly<{
  promotion: PromotionRow | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.marketing");
  const isEdit = promotion !== null;
  const [code, setCode] = useState(promotion?.code ?? "");
  const [name, setName] = useState(promotion?.title ?? "");
  const [kind, setKind] = useState(promotion?.type ?? "PERCENT");
  const [value, setValue] = useState(String(promotion?.value ?? ""));
  const [startsAt, setStartsAt] = useState(promotion?.startAt?.slice(0, 10) ?? "");
  const [endsAt, setEndsAt] = useState(promotion?.endAt?.slice(0, 10) ?? "");
  const [issuanceLimit, setIssuanceLimit] = useState("1000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericValue = Number(value.replace(/[^\d]/g, ""));
  const numericIssuanceLimit = Number(issuanceLimit.replace(/[^\d]/g, ""));
  // Creating a promotion requires both dates; the backend rejects the request
  // outright without them, and the code must be A-Z 0-9 _ - only.
  const canSubmit =
    name.trim().length >= 2 &&
    numericValue > 0 &&
    (isEdit || (/^[A-Z0-9_-]{3,60}$/.test(code.trim().toUpperCase()) && startsAt !== "" && endsAt !== "" && numericIssuanceLimit > 0)) &&
    !busy;

  // The backend takes one `value` alongside `type`; it has no `percentage`
  // field and reads neither `kind` nor `discountType`.
  const amountFields = { type: kind, value: numericValue };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isEdit && promotion) {
        await adminService.updatePromotion(
          promotion.id,
          { title: name.trim(), ...amountFields, startAt: startsAt || undefined, endAt: endsAt || undefined },
          promotion.version,
        );
      } else {
        await adminService.createPromotion({
          code: code.trim().toUpperCase(),
          title: name.trim(),
          ...amountFields,
          startAt: startsAt,
          endAt: endsAt,
          issuanceLimit: numericIssuanceLimit,
        });
      }
      notifySuccess(isEdit ? "Đã cập nhật khuyến mãi" : "Đã thêm khuyến mãi");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("promotionModal.failed"));
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
                {isEdit ? t("promotionModal.editTitle") : t("promotionModal.addTitle")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("promotionModal.code")}</span>
                <input
                  className={inputClass}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="SUMMER20"
                  disabled={isEdit}
                  autoFocus={!isEdit}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("promotionModal.name")}</span>
                <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("promotionModal.namePlaceholder")} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("promotionModal.type")}</span>
                  <AdminSelectField
                    label={t("promotionModal.typeLabel")}
                    fullWidth
                    value={kind}
                    onChange={setKind}
                    options={[
                      { value: "PERCENT", label: t("promotionModal.percentOption") },
                      { value: "FIXED", label: t("promotionModal.fixedOption") },
                    ]}
                  />
                </div>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">
                    {kind === "PERCENT" ? t("promotionModal.percentValue") : t("promotionModal.fixedValue")}
                  </span>
                  <input inputMode="numeric" className={inputClass} value={value} onChange={(event) => setValue(event.target.value)} placeholder={kind === "PERCENT" ? "20" : "50000"} />
                </label>
              </div>
              {!isEdit ? (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("promotionModal.issueLimit")}</span>
                  <input inputMode="numeric" className={inputClass} value={issuanceLimit} onChange={(event) => setIssuanceLimit(event.target.value)} placeholder="1000" />
                </label>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("promotionModal.startAt")}</span>
                  <input type="date" className={inputClass} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("promotionModal.endAt")}</span>
                  <input type="date" className={inputClass} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
                </label>
              </div>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>{t("promotionModal.cancel")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
                {busy ? t("promotionModal.saving") : isEdit ? t("promotionModal.save") : t("promotionModal.add")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
