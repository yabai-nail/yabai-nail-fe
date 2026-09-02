"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { useAdminNailDesigns } from "@/service";
import { DesignModal } from "./DesignModal";
import {
  adaptDesign,
  designStatuses,
  filterDesigns,
  paginate,
  type DesignRow,
} from "./data";

const pageSize = 8;

export function AdminNailDesignsComponent() {
  const t = useTranslations("admin.nailDesigns");
  const { data, isLoading, error, mutate } = useAdminNailDesigns();
  // Status codes come from the API. t.has() keeps an unrecognised one rendering as
  // its raw code instead of throwing, which is what the old map did with ?? code.
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;

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
          {t("statusLabel")}
          <AdminSelectField
            label={t("filterLabel")}
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={[
              { value: "all", label: t("all") },
              ...statuses.map((code) => ({ value: code, label: statusLabel(code) })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminSearchField label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
          <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
            <PlusIcon className="size-4" />{t("add")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3">{t("columns.design")}</th>
                <th className="px-4 py-3">{t("columns.status")}</th>
                <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-admin-muted">{t("empty")}</td></tr>
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
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>{t("edit")}</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>{t("pagination", { shown: visible.length, total: filtered.length })}</span>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
              <Button key={value} size="sm" variant={currentPage === value ? "outline" : "ghost"} className={currentPage === value ? "min-w-9 rounded-lg border-admin-accent text-admin-accent" : "min-w-9"} onPress={() => setPage(value)}>{value}</Button>
            ))}
          </div>
        </Card.Footer>
      </Card>

      {creating ? <DesignModal design={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <DesignModal design={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-nail-designs" } as const;
