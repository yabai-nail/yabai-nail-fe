"use client";

import { Button, Modal } from "@heroui/react";

export type DetailRow = { readonly key: string; readonly value: string };

/** Flattens a record into displayable rows: primitives as-is, objects/arrays as JSON. */
export function toDetailRows(record: Record<string, unknown> | undefined): ReadonlyArray<DetailRow> {
  if (!record) return [];
  return Object.entries(record).map(([key, value]) => {
    if (value === null || value === undefined) return { key, value: "—" };
    if (typeof value === "object") {
      try {
        return { key, value: JSON.stringify(value) };
      } catch {
        return { key, value: String(value) };
      }
    }
    return { key, value: String(value) };
  });
}

/**
 * Read-only detail modal shared by admin list screens. It renders whatever a
 * by-id read returns, so a screen can drill into one record without a bespoke
 * modal per resource.
 */
export function AdminRecordDetail({
  title,
  isLoading,
  error,
  data,
  onClose,
}: Readonly<{
  title: string;
  isLoading: boolean;
  error: unknown;
  data: Record<string, unknown> | undefined;
  onClose: () => void;
}>) {
  const rows = toDetailRows(data);

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-5 py-5">
              {isLoading ? (
                <p className="text-sm text-admin-muted">Đang tải…</p>
              ) : error ? (
                <p className="text-sm text-admin-danger" role="alert">Không tải được chi tiết.</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-admin-muted">Không có dữ liệu.</p>
              ) : (
                <dl className="grid gap-2">
                  {rows.map((row) => (
                    <div key={row.key} className="grid grid-cols-[10rem_1fr] gap-3 border-b border-admin-border pb-2 text-sm last:border-0">
                      <dt className="truncate font-semibold text-admin-muted">{row.key}</dt>
                      <dd className="min-w-0 break-words text-admin-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-end border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>Đóng</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export const meta = { world: "connected", domain: "admin-record-detail" } as const;
