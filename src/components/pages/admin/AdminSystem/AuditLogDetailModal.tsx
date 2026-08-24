"use client";

import { Button, Modal } from "@heroui/react";

import { useAdminAuditLog } from "@/service";
import { formatDateTime } from "./normalize";

/**
 * Fetches and shows the full record for one audit-log entry, including the diff
 * the list view omits. The list already has the summary fields; this pulls the
 * authoritative single-record read so nothing is inferred from the list row.
 */
export function AuditLogDetailModal({
  logId,
  onClose,
}: Readonly<{
  logId: string;
  onClose: () => void;
}>) {
  const { data, isLoading, error } = useAdminAuditLog(logId);

  const rows: ReadonlyArray<readonly [string, string]> = data
    ? [
        ["Mã", data.id],
        ["Hành động", data.action],
        ["Loại chủ thể", data.actorType ?? "—"],
        ["Chủ thể", data.actorId ?? "—"],
        ["Loại đối tượng", data.targetType ?? "—"],
        ["Đối tượng", data.targetId ?? "—"],
        ["Chi nhánh", data.branchId ?? "—"],
        ["Thời điểm", formatDateTime(data.createdAt)],
      ]
    : [];

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">Chi tiết nhật ký</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5 text-sm">
              {isLoading ? (
                <p className="text-admin-muted">Đang tải chi tiết…</p>
              ) : error ? (
                <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                  Không tải được chi tiết nhật ký.
                </p>
              ) : (
                <>
                  <dl className="grid gap-2">
                    {rows.map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5 border-b border-admin-border pb-2 sm:flex-row sm:gap-4">
                        <dt className="w-40 shrink-0 text-xs font-semibold text-admin-muted">{label}</dt>
                        <dd className="min-w-0 break-all font-mono text-xs text-admin-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {data?.diff ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-admin-muted">Thay đổi</span>
                      <pre className="max-h-72 overflow-auto rounded-lg bg-admin-canvas px-3 py-2 font-mono text-xs text-admin-ink">
                        {JSON.stringify(data.diff, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="primary" className="rounded-lg" onPress={onClose}>
                Đóng
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
