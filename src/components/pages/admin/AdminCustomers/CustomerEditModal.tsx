"use client";

import { useTranslations } from "next-intl";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import type { Customer } from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

export function CustomerEditModal({
  customer,
  onClose,
  onConfirm,
  submitting = false,
  error = null,
}: Readonly<{
  customer: Customer;
  onClose: () => void;
  onConfirm: (patch: { displayName?: string; locale?: string; status?: string }) => void;
  submitting?: boolean;
  error?: string | null;
}>) {
  const t = useTranslations("admin.customers");
  const [displayName, setDisplayName] = useState(customer.name);
  const [locale, setLocale] = useState<"vi" | "ja">((customer.locale as "vi" | "ja") ?? "vi");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    (customer.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
  );

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4">
              <PencilSquareIcon className="size-5 text-admin-accent" />
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("edit.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-4 text-sm">
              <label htmlFor="edit-cust-name" className="block text-xs font-semibold text-admin-ink">
                Họ tên hiển thị
                <input
                  id="edit-cust-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-sm text-admin-ink"
                />
              </label>

              <div className="block text-xs font-semibold text-admin-ink">
                Ngôn ngữ ưu tiên
                <AdminSelectField
                  label={t("edit.localeLabel")}
                  fullWidth
                  className="mt-1"
                  value={locale}
                  onChange={(value) => setLocale(value as typeof locale)}
                  options={[
                    { value: "vi", label: "Tiếng Việt" }, // i18n-check: allow endonym — a language names itself, identically in every catalogue
                    { value: "ja", label: "日本語" },
                  ]}
                />
              </div>

              <div className="block text-xs font-semibold text-admin-ink">
                Trạng thái tài khoản
                <AdminSelectField
                  label={t("edit.statusLabel")}
                  fullWidth
                  className="mt-1"
                  value={status}
                  onChange={(value) => setStatus(value as typeof status)}
                  options={[
                    { value: "ACTIVE", label: t("edit.statusActive") },
                    { value: "INACTIVE", label: t("edit.statusInactive") },
                  ]}
                />
              </div>

              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="border-t border-admin-border px-5 py-4">
              <Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose} isDisabled={submitting}>
                Đóng
              </Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() =>
                  onConfirm({
                    displayName: displayName.trim() || undefined,
                    locale,
                    status,
                  })
                }
                isDisabled={submitting || displayName.trim().length === 0}
              >
                {submitting ? t("edit.saving") : t("edit.save")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
