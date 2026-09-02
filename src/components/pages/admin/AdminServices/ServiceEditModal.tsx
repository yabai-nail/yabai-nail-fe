"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import { adminService, useAdminServiceCategories } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import type { SalonService } from "./data";

// Mirror of ServiceCreateModal, plus PATCH with If-Match so we don't clobber a concurrent
// edit. Moving a service between categories happens here: the API assigns whichever category
// the body names, and a service can never be left without one.
export function ServiceEditModal({
  service,
  onClose,
  onSaved,
}: Readonly<{
  service: SalonService;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.services");
  const categories = useAdminServiceCategories();
  const categoryItems = categories.data?.items ?? [];
  const [name, setName] = useState(service.name);
  const [categoryId, setCategoryId] = useState(service.category?.id ?? "");
  const [price, setPrice] = useState(String(service.price));
  const [duration, setDuration] = useState(String(service.durationMinutes));
  const [imageUrl, setImageUrl] = useState(service.imageUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = Number(price.replace(/\D/g, ""));
  const durationNum = Number(duration);
  const trimmedImage = imageUrl.trim();
  const imageLooksValid = trimmedImage === "" || /^https?:\/\/\S+$/.test(trimmedImage);
  const canSubmit =
    name.trim().length >= 2 &&
    categoryId !== "" &&
    priceNum > 0 &&
    durationNum > 0 &&
    imageLooksValid &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.updateService(
        service.id,
        {
          name: name.trim(),
          categoryId,
          price: priceNum,
          durationMinutes: durationNum,
          // Sent even when blank: an empty string is how the API clears a photo.
          imageUrl: trimmedImage,
        },
        service.version,
      );
      notifySuccess("Đã cập nhật dịch vụ");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("edit.failed"));
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
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("edit.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("create.name")}</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Danh mục</span>
                <select
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">— Chọn danh mục —</option>
                  {categoryItems.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nameVi ?? category.name}
                    </option>
                  ))}
                </select>
                {categories.isLoading ? <span className="text-xs text-admin-muted">Đang tải danh mục…</span> : null}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("create.price")}</span>
                  <input
                    inputMode="numeric"
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("create.duration")}</span>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Ảnh dịch vụ (không bắt buộc)</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://..."
                />
                {trimmedImage && !imageLooksValid ? (
                  <span role="alert" className="text-xs text-admin-danger">Ảnh phải là địa chỉ http(s) đầy đủ.</span>
                ) : trimmedImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={trimmedImage} alt="" className="size-20 rounded-lg border border-admin-border object-cover" />
                ) : null}
              </label>
              {/*
                No visibility toggle: the field is called `status`, not `active`, and restoring
                the checkbox is a separate change the salon has not asked for yet.
              */}
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>{t("categoryEditor.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canSubmit}
                onPress={() => void submit()}
              >
                {busy ? t("categoryEditor.saving") : t("categoryEditor.save")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
