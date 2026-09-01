"use client";

import { Button, Modal } from "@heroui/react";
import { useState } from "react";

import { adminService, useAdminServiceCategories } from "@/service";
import { notifySuccess } from "@/lib/app-toast";

// Service creation is org-level (no branchId in the path). The category is required by the
// API, not merely by this form: the column is NOT NULL, so a service with no category cannot
// exist. The photo is a plain absolute URL — the media upload endpoint hands out a signed link
// that expires in 300s and only its uploader may read, so it cannot back a customer-facing menu.
export function ServiceCreateModal({
  onClose,
  onCreated,
}: Readonly<{
  onClose: () => void;
  onCreated: () => void;
}>) {
  const categories = useAdminServiceCategories();
  const categoryItems = categories.data?.items ?? [];
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [imageUrl, setImageUrl] = useState("");
  const [isVisible, setIsVisible] = useState(true);
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
    durationNum % 15 === 0 &&
    imageLooksValid &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.createService({
        name: name.trim(),
        categoryId,
        price: priceNum,
        durationMinutes: durationNum,
        ...(trimmedImage ? { imageUrl: trimmedImage } : {}),
        status: isVisible ? "ACTIVE" : "INACTIVE",
      });
      notifySuccess("Đã thêm dịch vụ");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không tạo được dịch vụ.");
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
              <Modal.Heading className="text-base font-bold text-admin-ink">Thêm dịch vụ</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Tên dịch vụ</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Sơn gel đơn sắc"
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
                {categories.isLoading ? (
                  <span className="text-xs text-admin-muted">Đang tải danh mục…</span>
                ) : categoryItems.length === 0 ? (
                  <span role="alert" className="text-xs text-admin-danger">
                    Chưa có danh mục nào. Hãy tạo danh mục ở cột bên phải trước.
                  </span>
                ) : null}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">Giá (¥)</span>
                  <input
                    inputMode="numeric"
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="6600"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">Thời lượng (phút)</span>
                  <input
                    type="number"
                    min={15}
                    step={15}
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
              <label className="flex items-center gap-3 text-sm text-admin-ink">
                <input
                  type="checkbox" className="accent-admin-accent"
                  checked={isVisible}
                  onChange={(event) => setIsVisible(event.target.checked)}
                />
                Hiển thị công khai cho khách
              </label>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Hủy</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canSubmit}
                onPress={() => void submit()}
              >
                {busy ? "Đang lưu…" : "Thêm dịch vụ"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
