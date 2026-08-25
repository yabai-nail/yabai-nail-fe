"use client";

import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminRecordDetail } from "@/components/blocks/admin/AdminRecordDetail";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { useAdminAuditLog, useAdminAuditLogs } from "@/service";
import {
  adaptAuditLog,
  auditActions,
  auditEntries as fixtureEntries,
  filterAuditEntries,
  formatAuditTime,
  paginate,
  type AuditEntry,
} from "./data";

const pageSize = 10;

export function AdminAuditLogsComponent() {
  const { data, isLoading, error } = useAdminAuditLogs();

  const source = useMemo<ReadonlyArray<AuditEntry>>(() => {
    if (!data?.items) return fixtureEntries;
    if (data.items.length === 0) return [];
    return data.items.map(adaptAuditLog);
  }, [data]);

  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = useAdminAuditLog(detailId);

  const actions = useMemo(() => auditActions(source), [source]);
  const filtered = useMemo(
    () => filterAuditEntries(source, query, action),
    [source, query, action],
  );
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          Hành động
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
          >
            <option value="all">Tất cả hành động</option>
            {actions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <AdminSearchField
          label="Tìm nhật ký"
          placeholder="Tìm theo hành động, người thực hiện, đối tượng..."
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">Đang tải nhật ký hệ thống…</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được — hiển thị dữ liệu mẫu.</p>
      ) : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Chi nhánh</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-admin-muted">
                    Không có nhật ký phù hợp.
                  </td>
                </tr>
              ) : (
                visible.map((entry) => (
                  <tr
                    key={entry.id}
                    className="cursor-pointer border-b border-admin-border last:border-0 hover:bg-admin-soft/50"
                    onClick={() => setDetailId(entry.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-admin-muted">
                      {formatAuditTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-admin-ink">{entry.actor}</td>
                    <td className="px-4 py-3 text-admin-ink">{entry.target}</td>
                    <td className="px-4 py-3 text-admin-muted">{entry.branchId ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>
            Hiển thị {visible.length} trong tổng số {filtered.length} bản ghi
          </span>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={currentPage === value ? "outline" : "ghost"}
                className={
                  currentPage === value
                    ? "min-w-9 rounded-lg border-admin-accent text-admin-accent"
                    : "min-w-9"
                }
                onPress={() => setPage(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        </Card.Footer>
      </Card>

      {detailId ? (
        <AdminRecordDetail
          title="Chi tiết nhật ký"
          isLoading={detail.isLoading}
          error={detail.error}
          data={detail.data as Record<string, unknown> | undefined}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-audit-logs" } as const;
