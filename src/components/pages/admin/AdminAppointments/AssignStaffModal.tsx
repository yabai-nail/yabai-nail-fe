"use client";

import { UserGroupIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import { useAdminAppointmentAllocationCandidates } from "@/service";
import type { Appointment } from "./data";

export function AssignStaffModal({
  branchId,
  appointment,
  onClose,
  onConfirm,
  submitting = false,
  error = null,
}: Readonly<{
  branchId: string | null;
  appointment: Appointment;
  onClose: () => void;
  onConfirm: (staffId: string, note: string) => void;
  submitting?: boolean;
  error?: string | null;
}>) {
  const { data, isLoading, error: loadError } = useAdminAppointmentAllocationCandidates(
    branchId,
    appointment.id,
  );
  const candidates = data?.items ?? [];
  const [staffId, setStaffId] = useState<string>(appointment.staff.id);
  const [note, setNote] = useState<string>("");

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog className="rounded-xl border border-admin-border bg-admin-surface">
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4">
              <UserGroupIcon className="size-5 text-admin-accent" />
              <Modal.Heading className="text-base font-bold text-admin-ink">Đổi nhân viên phụ trách</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4 px-5 py-4 text-sm">
              <p className="text-xs text-admin-muted">
                Lịch của <strong className="text-admin-ink">{appointment.customer.name}</strong> lúc {appointment.startTime}.
              </p>

              {isLoading ? (
                <p className="text-xs text-admin-muted">Đang tải danh sách nhân viên phù hợp…</p>
              ) : loadError ? (
                <p role="alert" className="text-xs text-admin-danger">
                  Không tải được danh sách nhân viên. Vẫn có thể giữ nguyên hoặc chọn lại nhân viên hiện tại.
                </p>
              ) : candidates.length === 0 ? (
                <p className="text-xs text-admin-muted">Không có nhân viên phù hợp cho khung giờ này.</p>
              ) : (
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold text-admin-ink">Nhân viên khả dụng</legend>
                  {candidates.map((candidate) => (
                    <label
                      key={candidate.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-admin-border p-3 hover:border-admin-accent"
                    >
                      <input
                        type="radio"
                        name="assign-staff"
                        value={candidate.id}
                        checked={staffId === candidate.id}
                        onChange={() => setStaffId(candidate.id)}
                        className="mt-1 accent-admin-accent"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-admin-ink">{candidate.displayName}</p>
                        {/*
                          The endpoint returns staff rows and nothing else — no
                          score and no reasons — so the ranking hints that used
                          to render here were bound to fields that never arrive.
                        */}
                      </div>
                    </label>
                  ))}
                </fieldset>
              )}

              <label htmlFor="assign-staff-note" className="block text-xs font-semibold text-admin-ink">
                Ghi chú nội bộ (tuỳ chọn)
                <textarea
                  id="assign-staff-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-sm text-admin-ink"
                />
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
                onPress={() => onConfirm(staffId, note.trim())}
                isDisabled={submitting || !staffId}
              >
                {submitting ? "Đang gán…" : "Xác nhận"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
