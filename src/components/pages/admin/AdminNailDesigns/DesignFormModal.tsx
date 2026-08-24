"use client";

import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useRef, useState } from "react";

import { adminService } from "@/service";
import { statusLabel, type DesignRow } from "./normalize";
import { rejectionReason, uploadDesignImage } from "./upload";

/**
 * One modal for both create and edit — the two bodies differ only in which
 * operation they land on, and splitting them would duplicate the whole upload
 * surface. `design === null` means create.
 *
 * The edit path sends `If-Match` (via `version`): runtime Swagger marks that
 * header **required** on `PATCH /api/v1/admin/nail-designs/{designId}`, so a row
 * that arrived without a numeric `version` cannot be saved. The form says so up
 * front rather than firing a request the backend will reject.
 */
export function DesignFormModal({
  design,
  statusOptions,
  onClose,
  onSaved,
}: Readonly<{
  design: DesignRow | null;
  statusOptions: ReadonlyArray<string>;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const isEdit = design !== null;
  const [name, setName] = useState(design?.name ?? "");
  const [status, setStatus] = useState(design?.status ?? statusOptions[0] ?? "");
  const [imageUrl, setImageUrl] = useState(design?.imageUrl ?? "");
  const [mediaId, setMediaId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const missingVersion = isEdit && design.version === undefined;
  const canSubmit = name.trim().length >= 2 && !busy && !isUploading && !missingVersion;

  const pickImage = async (file: File) => {
    const reason = rejectionReason(file);
    if (reason) {
      setError(reason);
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadDesignImage(file);
      setImageUrl(uploaded.url);
      setMediaId(uploaded.mediaId);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Tải ảnh lên thất bại.");
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      // `mediaId` rides along only when this save actually uploaded a new
      // image. The access URL from step 4 of the media flow is short-lived, so
      // the durable handle is the media id — and the nail-design body is
      // `additionalProperties: true`, so an extra key is tolerated. If the
      // backend ignores it, `imageUrl` is still what the public catalogue reads
      // today (`src/service/catalog/types.ts`).
      const body = {
        name: name.trim(),
        ...(status ? { status } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(mediaId ? { imageMediaId: mediaId } : {}),
      };

      if (isEdit) {
        await adminService.updateNailDesign(design.id, body, design.version);
      } else {
        await adminService.createNailDesign(body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isEdit
            ? "Không lưu được mẫu nail."
            : "Không tạo được mẫu nail.",
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
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {isEdit ? "Sửa mẫu nail" : "Thêm mẫu nail"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Tên mẫu</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ombré hồng phấn"
                  autoFocus
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Trạng thái</span>
                <select
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink outline-none focus:border-admin-accent"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {statusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">Ảnh mẫu</span>
                <div className="flex items-center gap-3">
                  <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-admin-border bg-admin-soft">
                    {imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img alt="" className="size-full object-cover" src={imageUrl} />
                    ) : (
                      <span className="text-[0.65rem] font-semibold text-admin-muted">
                        Chưa có
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <Button
                      variant="ghost"
                      className="rounded-lg"
                      isDisabled={isUploading || busy}
                      onPress={() => fileInput.current?.click()}
                    >
                      <ArrowUpTrayIcon aria-hidden="true" className="size-4" />
                      {isUploading ? "Đang tải ảnh…" : "Chọn ảnh"}
                    </Button>
                    <p className="mt-1 text-xs text-admin-muted">Tệp ảnh, tối đa 8 MB.</p>
                  </div>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Tải ảnh mẫu nail"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void pickImage(file);
                  }}
                />
              </div>

              {missingVersion ? (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                  Mẫu này không kèm số phiên bản nên không thể lưu — backend bắt buộc
                  header If-Match khi cập nhật. Tải lại danh sách rồi thử lại.
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>
                Hủy
              </Button>
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canSubmit}
                onPress={() => void submit()}
              >
                {busy ? "Đang lưu…" : isEdit ? "Lưu thay đổi" : "Thêm mẫu"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
