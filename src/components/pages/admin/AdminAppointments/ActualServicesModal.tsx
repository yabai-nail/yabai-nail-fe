"use client";

import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import { useAdminServices } from "@/service";
import type { Appointment } from "./data";

export function ActualServicesModal({
  appointment,
  onClose,
  onConfirm,
  submitting = false,
  error = null,
}: Readonly<{
  appointment: Appointment;
  onClose: () => void;
  onConfirm: (serviceIds: ReadonlyArray<string>) => void;
  submitting?: boolean;
  error?: string | null;
}>) {
  const { data, isLoading, error: loadError } = useAdminServices();
  const services = data?.items ?? [];
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set([appointment.service.id]),
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4">
              <WrenchScrewdriverIcon className="size-5 text-admin-accent" />
              <Modal.Heading className="text-base font-bold text-admin-ink">Cập nhật dịch vụ thực tế</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-4 text-sm">
              <p className="text-xs text-admin-muted">
                Chọn danh sách dịch vụ thực sự đã thực hiện. Danh sách này ghi đè dịch vụ đặt ban đầu.
              </p>

              {isLoading ? (
                <p className="text-xs text-admin-muted">Đang tải danh mục dịch vụ…</p>
              ) : loadError ? (
                <p role="alert" className="text-xs text-admin-danger">
                  Không tải được danh mục dịch vụ.
                </p>
              ) : services.length === 0 ? (
                <p className="text-xs text-admin-muted">Chưa có dịch vụ nào.</p>
              ) : (
                <ul className="max-h-72 overflow-y-auto rounded-lg border border-admin-border">
                  {services.map((service) => (
                    <li key={service.id} className="border-b border-admin-border last:border-b-0">
                      <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-admin-soft">
                        <input
                          type="checkbox" className="accent-admin-accent"
                          checked={selected.has(service.id)}
                          onChange={() => toggle(service.id)}
                        />
                        <span className="flex-1 truncate text-sm text-admin-ink">{service.name}</span>
                        {service.durationMinutes ? (
                          <span className="text-[0.65rem] text-admin-muted">{service.durationMinutes} phút</span>
                        ) : null}
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="border-t border-admin-border px-5 py-4">
              <Button variant="outline" className="rounded-lg border-admin-border" onPress={onClose} isDisabled={submitting}>
                Đóng
              </Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => onConfirm([...selected])}
                isDisabled={submitting || selected.size === 0}
              >
                {submitting ? "Đang lưu…" : "Lưu dịch vụ thực tế"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
