"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import { adminService, useAdminBranchList, type AdminServiceCategory } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import type { SalonService } from "./data";

// One modal for create + edit. When `category` is null it POSTs; otherwise it PATCHes with
// If-Match. Turning a category on or off lives in the table row instead, so there is exactly one
// control for it.
export function CategoryEditor({
  category,
  services,
  onClose,
  onSaved,
}: Readonly<{
  category: AdminServiceCategory | null;
  /** The catalogue, so services can be moved into this category without leaving the modal. */
  services: ReadonlyArray<SalonService>;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.services");
  const isEdit = category !== null;
  const branches = useAdminBranchList();
  const branchItems = branches.data?.items ?? [];
  const [code, setCode] = useState(category?.code ?? "");
  const [name, setName] = useState(category?.name ?? "");
  const [nameVi, setNameVi] = useState(category?.nameVi ?? "");
  const [nameJa, setNameJa] = useState(category?.nameJa ?? "");
  const [branchIds, setBranchIds] = useState<ReadonlyArray<string>>(category?.branchIds ?? []);
  const [moving, setMoving] = useState<ReadonlyArray<string>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const members = services.filter((service) => service.category?.id === category?.id);
  const outsiders = services.filter((service) => service.category?.id !== category?.id);
  const canSubmit = code.trim().length > 0 && name.trim().length > 0 && !busy;

  const toggle = (list: ReadonlyArray<string>, id: string) =>
    list.includes(id) ? list.filter((value) => value !== id) : [...list, id];

  const allBranches = branchItems.length > 0 && branchIds.length === branchItems.length;
  const allServices = outsiders.length > 0 && moving.length === outsiders.length;

  const fieldClass =
    "min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus-visible:ring-2 focus-visible:ring-admin-accent";
  const labelClass = "text-sm font-semibold text-admin-ink";
  const pickAllClass =
    "rounded-lg px-2 py-1 text-xs font-semibold text-admin-accent hover:bg-admin-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent";

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const body = {
      code: code.trim(),
      name: name.trim(),
      nameVi: nameVi.trim() || undefined,
      nameJa: nameJa.trim() || undefined,
      branchIds,
      // Assigns; it never unassigns. A service leaves a category by being given another one.
      ...(moving.length ? { serviceIds: moving } : {}),
    };
    try {
      if (isEdit) {
        await adminService.updateServiceCategory(category.id, body, category.version);
      } else {
        await adminService.createServiceCategory(body);
      }
      notifySuccess(isEdit ? "Đã cập nhật danh mục" : "Đã thêm danh mục");
      onSaved();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : t("categoryEditor.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-6 py-5">
              <Modal.Heading className="text-lg font-bold text-admin-ink">
                {isEdit ? "Sửa danh mục" : t("categoryEditor.addTitle")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-5 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>{t("categoryEditor.code")}</span>
                  <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="GEL" className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>{t("categoryEditor.displayName")}</span>
                  <input value={nameVi} onChange={(event) => setNameVi(event.target.value)} placeholder={t("categoryEditor.displayPlaceholder")} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>{t("categoryEditor.internalName")}</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Gel manicure" className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Nhật ngữ</span>
                  <input value={nameJa} onChange={(event) => setNameJa(event.target.value)} placeholder="ジェルネイル" className={fieldClass} />
                </label>
              </div>

              <fieldset className="rounded-lg border border-admin-border p-4">
                <legend className={`px-1 ${labelClass}`}>Chi nhánh hiển thị</legend>
                <div className="mb-3 flex items-center justify-between gap-2">
                  {/* Ticking every branch and ticking none mean the same thing to the API; the note
                      says so, and the button is here because ticking four boxes by hand is tedious. */}
                  <p className="text-xs text-admin-muted">Không chọn chi nhánh nào cũng có nghĩa là hiện ở tất cả.</p>
                  <button
                    type="button"
                    className={`${pickAllClass} shrink-0`}
                    onClick={() => setBranchIds(allBranches ? [] : branchItems.map((branch) => branch.id))}
                  >
                    {allBranches ? "Bỏ chọn" : "Chọn tất cả"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {branchItems.map((branch) => (
                    <label key={branch.id} className="flex items-center gap-2.5 text-sm text-admin-ink">
                      <input
                        type="checkbox"
                        className="size-4 accent-admin-accent"
                        checked={branchIds.includes(branch.id)}
                        onChange={() => setBranchIds((current) => toggle(current, branch.id))}
                      />
                      {branch.name}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="rounded-lg border border-admin-border p-4">
                <legend className={`px-1 ${labelClass}`}>{t("table.service")}</legend>
                {isEdit ? (
                  <p className="mb-3 text-xs text-admin-muted">
                    Đang có <strong className="text-admin-ink">{members.length}</strong> dịch vụ:{" "}
                    {members.length ? members.map((service) => service.name).join(", ") : "chưa có dịch vụ nào"}.
                    Muốn chuyển một dịch vụ đi, hãy gán nó vào danh mục khác.
                  </p>
                ) : null}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-admin-muted">Chọn dịch vụ để chuyển vào danh mục này:</p>
                  {outsiders.length > 0 ? (
                    <button
                      type="button"
                      className={`${pickAllClass} shrink-0`}
                      onClick={() => setMoving(allServices ? [] : outsiders.map((service) => service.id))}
                    >
                      {allServices ? "Bỏ chọn" : "Chọn tất cả"}
                    </button>
                  ) : null}
                </div>
                <div className="grid max-h-56 gap-2 overflow-y-auto">
                  {outsiders.length === 0 ? (
                    <span className="text-sm text-admin-muted">Mọi dịch vụ đều đã ở đây.</span>
                  ) : (
                    outsiders.map((service) => (
                      <label key={service.id} className="flex items-center gap-2.5 text-sm text-admin-ink">
                        <input
                          type="checkbox"
                          className="size-4 accent-admin-accent"
                          checked={moving.includes(service.id)}
                          onChange={() => setMoving((current) => toggle(current, service.id))}
                        />
                        <span className="min-w-0 flex-1 truncate">{service.name}</span>
                        <span className="shrink-0 text-xs text-admin-muted">{service.category?.name ?? "chưa phân loại"}</span>
                      </label>
                    ))
                  )}
                </div>
              </fieldset>

              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-6 py-4">
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>{t("categoryEditor.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={!canSubmit}
              >
                {busy ? t("categoryEditor.saving") : isEdit ? t("categoryEditor.save") : t("categoryEditor.add")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
