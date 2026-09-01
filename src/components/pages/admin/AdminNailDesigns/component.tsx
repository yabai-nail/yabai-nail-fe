"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { useAdminNailDesigns } from "@/service";
import { DesignModal } from "./DesignModal";
import {
  adaptDesign,
  designStatusLabels,
  designStatuses,
  filterDesigns,
  paginate,
  type DesignRow,
} from "./data";

const pageSize = 8;

export function AdminNailDesignsComponent() {
  const { data, isLoading, error, mutate } = useAdminNailDesigns();

  const source = useMemo<ReadonlyArray<DesignRow>>(
    () => (data?.items ? data.items.map(adaptDesign) : []),
    [data],
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DesignRow | null>(null);
  const [creating, setCreating] = useState(false);

  const statuses = useMemo(() => designStatuses(source), [source]);
  const filtered = useMemo(() => filterDesigns(source, status, query), [source, status, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          Trạng thái
          <AdminSelectField
            label="Lọc theo trạng thái mẫu nail"
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={[
              { value: "all", label: "Tất cả" },
              ...statuses.map((code) => ({ value: code, label: designStatusLabels[code] ?? code })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminSearchField label="Tìm mẫu nail" placeholder="Tên mẫu..." value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
          <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
            <PlusIcon className="size-4" />Thêm mẫu
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">Đang tải mẫu nail…</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được danh sách mẫu nail.</p>
      ) : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3">Mẫu</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-admin-muted">Không có mẫu phù hợp.</td></tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/*
                          The endpoint returns mediaIds, not a URL, so a
                          thumbnail needs the media access-url flow. Until that
                          is wired, show the placeholder rather than an <img>
                          bound to a field that never arrives.
                        */}
                        <span className="grid size-10 place-items-center rounded-lg bg-admin-soft text-admin-accent">✦</span>
                        <span className="font-medium text-admin-ink">{row.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                        {designStatusLabels[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>Sửa</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>Hiển thị {visible.length} trong tổng số {filtered.length} mẫu</span>
          <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </Card.Footer>
      </Card>

      {creating ? <DesignModal design={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <DesignModal design={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-nail-designs" } as const;
