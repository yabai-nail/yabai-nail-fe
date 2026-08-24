"use client";

import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";

import { useAdminAuditLogs } from "@/service";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import { formatDateTime } from "./normalize";

const PAGE_SIZE = 20;

/**
 * Cursor-paginated audit log. Each stack entry is the cursor that opened the
 * page at that depth, so "Trang trước" pops rather than refetching from page
 * one. A row opens the authoritative single-record detail.
 */
export function AuditLogTab() {
  const [cursorStack, setCursorStack] = useState<ReadonlyArray<string>>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  const cursor = cursorStack[cursorStack.length - 1];
  const query = useMemo(
    () => ({ limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) }),
    [cursor],
  );

  const { data, isLoading, error } = useAdminAuditLogs(query);
  const logs = data?.items ?? [];
  const pageInfo = data?.pageInfo;
  const hasNextPage = Boolean(pageInfo?.hasNextPage && pageInfo.endCursor);

  return (
    <Card className="mt-4 overflow-hidden rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Header className="flex flex-col gap-1 border-b border-admin-border px-5 py-4">
        <h2 className="text-base font-bold text-admin-ink">Nhật ký hệ thống</h2>
        <p className="text-xs text-admin-muted">Lịch sử thao tác của quản trị viên và hệ thống.</p>
      </Card.Header>
      <Card.Content className="p-0">
        {error ? (
          <p role="alert" className="m-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            Không tải được nhật ký.
          </p>
        ) : null}
        {isLoading ? (
          <p className="p-6 text-center text-sm text-admin-muted">Đang tải nhật ký…</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-center text-sm text-admin-muted">Chưa có bản ghi nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-admin-border text-left text-xs text-admin-muted">
                  <th className="px-4 py-3 font-semibold">Thời điểm</th>
                  <th className="px-4 py-3 font-semibold">Hành động</th>
                  <th className="px-4 py-3 font-semibold">Chủ thể</th>
                  <th className="px-4 py-3 font-semibold">Đối tượng</th>
                  <th className="px-4 py-3 text-right font-semibold">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {logs.map((log) => (
                  <tr key={log.id} className="text-admin-ink">
                    <td className="px-4 py-3 text-xs text-admin-muted">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-admin-muted">
                      {log.actorType ? `${log.actorType} · ` : ""}
                      {log.actorId ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-admin-muted">
                      {log.targetType ? `${log.targetType} · ` : ""}
                      {log.targetId ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg border-admin-border"
                          onPress={() => setDetailId(log.id)}
                        >
                          Xem
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-admin-border px-4 py-3">
          <span className="text-xs text-admin-muted">Trang {cursorStack.length + 1}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-admin-border"
              onPress={() => setCursorStack((stack) => stack.slice(0, -1))}
              isDisabled={cursorStack.length === 0 || isLoading}
            >
              Trang trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-admin-border"
              onPress={() => {
                const endCursor = pageInfo?.endCursor;
                if (!endCursor) return;
                setCursorStack((stack) => [...stack, endCursor]);
              }}
              isDisabled={!hasNextPage || isLoading}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </Card.Content>

      {detailId ? (
        <AuditLogDetailModal logId={detailId} onClose={() => setDetailId(null)} />
      ) : null}
    </Card>
  );
}
