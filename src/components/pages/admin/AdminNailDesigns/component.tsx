"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { useAdminNailDesigns } from "@/service";
import { DesignFormModal } from "./DesignFormModal";
import { DesignGrid } from "./DesignGrid";
import { ProposalQueue } from "./ProposalQueue";
import {
  collectStatuses,
  isPendingRow,
  isProposalRow,
  matchesQuery,
  statusLabel,
  toDesignRow,
  type DesignRow,
} from "./normalize";

const PAGE_SIZE = 24;

/**
 * Nail designs are org-level, not branch-level: `GET /api/v1/admin/nail-designs`
 * takes no `branchId` (path or query), so this screen intentionally does not
 * read `useAdminBranch()` — filtering by the selected branch would be a lie.
 */
export function AdminNailDesignsComponent() {
  const query = useMemo(() => ({ limit: PAGE_SIZE }), []);
  const { data, isLoading, error, mutate } = useAdminNailDesigns(query);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<DesignRow | null>(null);

  const rows = useMemo<ReadonlyArray<DesignRow>>(
    () => (data?.items ?? []).map(toDesignRow),
    [data],
  );
  const statusOptions = useMemo(() => collectStatuses(rows), [rows]);

  const proposals = useMemo(() => rows.filter(isProposalRow), [rows]);
  const catalogue = useMemo(() => rows.filter((row) => !isProposalRow(row)), [rows]);
  const pendingWithoutProposalId = useMemo(
    () => catalogue.filter(isPendingRow).length,
    [catalogue],
  );

  const visible = useMemo(
    () =>
      catalogue.filter(
        (row) =>
          matchesQuery(row, search) &&
          (statusFilter === "all" || row.status === statusFilter),
      ),
    [catalogue, search, statusFilter],
  );

  const revalidate = () => void mutate();

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
          <AdminSearchField
            label="Tìm mẫu nail"
            placeholder="Tên mẫu, kiểu, độ dài…"
            value={search}
            onChange={setSearch}
          />
          <label htmlFor="design-status-filter" className="text-sm font-semibold text-admin-ink">
            <span className="mb-1 block">Trạng thái</span>
            <select
              id="design-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-9 rounded-lg border border-admin-border bg-admin-surface px-2 text-sm font-normal text-admin-ink outline-none focus:border-admin-accent"
            >
              <option value="all">Tất cả</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button variant="primary" className="rounded-lg" onPress={() => setIsCreating(true)}>
          <PlusIcon aria-hidden="true" className="size-4" />
          Thêm mẫu
        </Button>
      </div>

      {/* The list operation declares no query parameter in runtime Swagger and
          this API ignores unknown query keys, so both filters narrow the page
          already loaded rather than pretending to filter server-side. */}
      <p className="mb-3 text-xs text-admin-muted">
        Bộ lọc áp dụng trong trang đang xem ({visible.length}/{catalogue.length} mẫu).
      </p>

      <AdminSplitLayout
        aside={
          <ProposalQueue
            proposals={proposals}
            pendingWithoutProposalId={pendingWithoutProposalId}
            isLoading={isLoading}
            onDecided={revalidate}
          />
        }
      >
        <DesignGrid
          designs={visible}
          isLoading={isLoading}
          errorMessage={error ? error.message : null}
          onEdit={setEditing}
        />
      </AdminSplitLayout>

      {isCreating ? (
        <DesignFormModal
          design={null}
          statusOptions={statusOptions}
          onClose={() => setIsCreating(false)}
          onSaved={revalidate}
        />
      ) : null}
      {editing ? (
        <DesignFormModal
          key={editing.id}
          design={editing}
          statusOptions={statusOptions}
          onClose={() => setEditing(null)}
          onSaved={revalidate}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-nail-designs" } as const;
