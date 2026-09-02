"use client";

import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminRecordDetail } from "@/components/blocks/admin/AdminRecordDetail";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { useAdminBranchDetail, useAdminBranchList } from "@/service";
import { BranchModal } from "./BranchModal";
import {
  adaptBranch,
  filterBranches,
  paginate,
  type BranchRow,
} from "./data";

const pageSize = 8;

export function AdminBranchesComponent() {
  const t = useTranslations("admin.branches");
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;
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
  const detailRecord = detail.data as unknown as Record<string, unknown> | undefined;
  const detailRows = detailRecord ? {
    [t("detail.name")]: String(detailRecord.name ?? t("detail.unnamed")),
    [t("columns.address")]: String(detailRecord.address ?? "—"),
    [t("columns.status")]: typeof detailRecord.active === "boolean"
      ? statusLabel(detailRecord.active ? "ACTIVE" : "INACTIVE")
      : "—",
    [t("detail.timezone")]: String(detailRecord.timezone ?? detailRecord.timeZone ?? "—"),
    [t("detail.activeStaff")]: Number((detailRecord.staffSummary as { activeCount?: unknown } | undefined)?.activeCount ?? 0),
    [t("detail.activeServices")]: Number((detailRecord.serviceSummary as { activeCount?: unknown } | undefined)?.activeCount ?? 0),
    [t("detail.totalAppointments")]: Number((detailRecord.kpi as { appointmentCount?: unknown } | undefined)?.appointmentCount ?? 0),
  } : undefined;

  const filtered = useMemo(() => filterBranches(source, query), [source, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <AdminSearchField label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
          <PlusIcon className="size-4" />Thêm chi nhánh
        </Button>
      </div>

      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3">{t("columns.branch")}</th>
                <th className="px-4 py-3">{t("columns.address")}</th>
                <th className="px-4 py-3">{t("columns.status")}</th>
                <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-admin-muted">{t("empty")}</td></tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border last:border-0">
                    <td className="px-4 py-3 font-medium text-admin-ink">{row.name}</td>
                    <td className="max-w-xs px-4 py-3 text-admin-muted">{row.address ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                        {row.status ? statusLabel(row.status) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => setDetailId(row.id)}>{t("detailAction")}</Button>
                        <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>{t("edit")}</Button>
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
          <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </Card.Footer>
      </Card>

      {creating ? <BranchModal branch={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <BranchModal branch={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
      {detailId ? (
        <AdminRecordDetail
          title={t("detail.title")}
          isLoading={detail.isLoading}
          error={detail.error}
          data={detailRows}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-branches" } as const;
