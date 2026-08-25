"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminRecordDetail } from "@/components/blocks/admin/AdminRecordDetail";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { useAdminBranchDetail, useAdminBranchList } from "@/service";
import { BranchModal } from "./BranchModal";
import {
  adaptBranch,
  branchStatusLabels,
  filterBranches,
  paginate,
  type BranchRow,
} from "./data";

const pageSize = 8;

export function AdminBranchesComponent() {
  const { data, isLoading, error, mutate } = useAdminBranchList();

  const source = useMemo<ReadonlyArray<BranchRow>>(
    () => (data?.items ? data.items.map(adaptBranch) : []),
    [data],
  );

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = useAdminBranchDetail(detailId);

  const filtered = useMemo(() => filterBranches(source, query), [source, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <AdminSearchField label="Tìm chi nhánh" placeholder="Tên, địa chỉ hoặc SĐT..." value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
          <PlusIcon className="size-4" />Thêm chi nhánh
        </Button>
      </div>

      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">Đang tải chi nhánh…</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được danh sách chi nhánh.</p>
      ) : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3">Chi nhánh</th>
                <th className="px-4 py-3">Địa chỉ</th>
                <th className="px-4 py-3">Điện thoại</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-admin-muted">Không có chi nhánh phù hợp.</td></tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border last:border-0">
                    <td className="px-4 py-3 font-medium text-admin-ink">{row.name}</td>
                    <td className="max-w-xs px-4 py-3 text-admin-muted">{row.address ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-admin-muted">{row.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                        {row.status ? branchStatusLabels[row.status] ?? row.status : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => setDetailId(row.id)}>Chi tiết</Button>
                        <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>Sửa</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>Hiển thị {visible.length} trong tổng số {filtered.length} chi nhánh</span>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
              <Button key={value} size="sm" variant={currentPage === value ? "outline" : "ghost"} className={currentPage === value ? "min-w-9 rounded-lg border-admin-accent text-admin-accent" : "min-w-9"} onPress={() => setPage(value)}>{value}</Button>
            ))}
          </div>
        </Card.Footer>
      </Card>

      {creating ? <BranchModal branch={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <BranchModal branch={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
      {detailId ? (
        <AdminRecordDetail
          title="Chi tiết chi nhánh"
          isLoading={detail.isLoading}
          error={detail.error}
          data={detail.data as Record<string, unknown> | undefined}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-branches" } as const;
