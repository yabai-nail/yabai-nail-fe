"use client";

import { useTranslations } from "next-intl";
import { Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminRecordDetail } from "@/components/blocks/admin/AdminRecordDetail";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import {
  useAdminAccounts,
  useAdminAuditLog,
  useAdminAuditLogs,
  useAdminBranchList,
  useAdminServices,
  useAdminStaff,
} from "@/service";
import {
  adaptAuditLog,
  auditActionLabel,
  auditActions,
  filterAuditEntries,
  formatAuditTime,
  paginate,
  type AuditEntry,
} from "./data";

const pageSize = 10;

export function AdminAuditLogsComponent() {
  const t = useTranslations("admin.auditLogs");
  const { data, isLoading, error } = useAdminAuditLogs();
  // Parallel joins: the log rows only carry ids, so the account and branch
  // lists resolve `actorId` / `metadata.branchId` into names the same way
  // AdminAppointments resolves its customer and staff ids.
  const { data: accountsData } = useAdminAccounts();
  const { data: branchesData } = useAdminBranchList();
  const { data: staffData } = useAdminStaff();
  const { data: servicesData } = useAdminServices();
  const lookups = useMemo(
    () => ({
      accounts: new Map((accountsData?.items ?? []).map((a) => [a.id, a] as const)),
      branches: new Map((branchesData?.items ?? []).map((b) => [b.id, b] as const)),
      staff: new Map((staffData?.items ?? []).map((member) => [member.id, member] as const)),
      services: new Map((servicesData?.items ?? []).map((service) => [service.id, service] as const)),
    }),
    [accountsData, branchesData, staffData, servicesData],
  );

  const source = useMemo<ReadonlyArray<AuditEntry>>(
    () => (data?.items ? data.items.map((log) => adaptAuditLog(log, lookups, t)) : []),
    [data, lookups, t],
  );

  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = useAdminAuditLog(detailId);

  const actions = useMemo(() => auditActions(source), [source]);
  const filtered = useMemo(
    () => filterAuditEntries(source, query, action, t),
    [source, query, action, t],
  );
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          Hành động
          <AdminSelectField
            label={t("filterLabel")}
            value={action}
            onChange={(value) => { setAction(value); setPage(1); }}
            options={[
              { value: "all", label: t("allActions") },
              ...actions.map((code) => ({ value: code, label: auditActionLabel(code, t) })),
            ]}
          />
        </div>
        <AdminSearchField
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
        />
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
                <th className="px-4 py-3">{t("columns.time")}</th>
                <th className="px-4 py-3">{t("columns.action")}</th>
                <th className="px-4 py-3">{t("columns.actor")}</th>
                <th className="px-4 py-3">{t("columns.target")}</th>
                <th className="px-4 py-3">{t("resource.Branch")}</th>
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
                        {auditActionLabel(entry.action, t)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-admin-ink">
                      {entry.actor}
                    </td>
                    <td className="px-4 py-3 text-admin-ink">
                      {entry.target}
                    </td>
                    <td className="px-4 py-3 text-admin-muted">
                      {entry.branch ?? "—"}
                    </td>
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
          <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </Card.Footer>
      </Card>

      {detailId ? (
        <AdminRecordDetail
          title={t("detailTitle")}
          isLoading={detail.isLoading}
          error={detail.error}
          data={detail.data ? (() => {
            const entry = adaptAuditLog(detail.data, lookups, t);
            return {
              [t("columns.action")]: auditActionLabel(entry.action, t),
              [t("columns.actor")]: entry.actor,
              [t("columns.target")]: entry.target,
              [t("resource.Branch")]: entry.branch ?? t("allBranches"),
              [t("columns.time")]: formatAuditTime(entry.createdAt),
            };
          })() : undefined}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-audit-logs" } as const;
