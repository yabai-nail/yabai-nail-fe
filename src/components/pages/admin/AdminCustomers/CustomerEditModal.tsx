"use client";

import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import type { Customer } from "./data";

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
            <Modal.Header className="flex items-center gap-3 border-b border-admin-border px-5 py-4">
              <PencilSquareIcon className="size-5 text-admin-accent" />
              <Modal.Heading className="text-base font-bold text-admin-ink">Chỉnh sửa khách hàng</Modal.Heading>
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

              <label htmlFor="edit-cust-locale" className="block text-xs font-semibold text-admin-ink">
                Ngôn ngữ ưu tiên
                <select
                  id="edit-cust-locale"
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as typeof locale)}
                  className="mt-1 block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-sm text-admin-ink"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="ja">日本語</option>
                </select>
              </label>

              <label htmlFor="edit-cust-status" className="block text-xs font-semibold text-admin-ink">
                Trạng thái tài khoản
                <select
                  id="edit-cust-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                  className="mt-1 block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-sm text-admin-ink"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
              </label>

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
                {submitting ? "Đang lưu…" : "Lưu"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
