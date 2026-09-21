"use client";

import { useFormatter, useTranslations } from "next-intl";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { useAdminNailDesignProposals, useAdminNailDesigns, useAuth, type AdminNailDesign, type AdminNailDesignProposal } from "@/service";
import { DesignModal } from "./DesignModal";
import { DesignDeleteModal } from "./DesignDeleteModal";
import { AdminNailDesignThumbnail } from "./AdminNailDesignThumbnail";
import { ProposalReviewModal } from "./ProposalReviewModal";
import { formatMoney } from "@/lib/admin-format";
import {
  adaptDesign,
  designStatuses,
  filterDesigns,
  paginate,
  upsertDesignInList,
  type DesignRow,
} from "./data";

const pageSize = 8;

export function AdminNailDesignsComponent() {
  const t = useTranslations("admin.nailDesigns");
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;
  const { permissions } = useAuth();
  const canManageCatalog = permissions?.includes("design.manage.all") ?? false;
  const canReviewProposals = permissions?.includes("design.propose.branch") ?? false;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const { data, isLoading, error, mutate } = useAdminNailDesigns({
    q: query.trim() || undefined,
    status: status === "all" ? undefined : status,
  }, canManageCatalog);
  const proposals = useAdminNailDesignProposals({ status: "PENDING" }, canReviewProposals);

  const source = useMemo<ReadonlyArray<DesignRow>>(
    () => (data?.items ? data.items.map(adaptDesign) : []),
    [data],
  );

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DesignRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DesignRow | null>(null);
  const [view, setView] = useState<"catalog" | "proposals">(canManageCatalog ? "catalog" : "proposals");
  const [reviewing, setReviewing] = useState<{ proposal: AdminNailDesignProposal; decision: "APPROVE" | "REJECT" } | null>(null);

  const statuses = useMemo(
    () => Array.from(new Set(["ACTIVE", "ARCHIVED", "DRAFT", "HIDDEN", "PUBLISHED", ...designStatuses(source)])),
    [source],
  );
  const filtered = useMemo(() => filterDesigns(source, status, query), [source, status, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);
  const syncSavedDesign = async (saved: AdminNailDesign) => {
    await mutate((current) => upsertDesignInList(current, saved), { revalidate: false });
    void mutate();
  };

  return (
    <AdminPageLayout>
      <div className="mb-4 flex gap-2 border-b border-admin-border pb-3">
        {canManageCatalog ? <Button variant={view === "catalog" ? "primary" : "outline"} className="rounded-lg" onPress={() => setView("catalog")}>{t("catalogTab")}</Button> : null}
        {canReviewProposals ? <Button variant={view === "proposals" ? "primary" : "outline"} className="rounded-lg" onPress={() => setView("proposals")}>{t("proposalsTab")} ({proposals.data?.items.length ?? 0})</Button> : null}
      </div>

      {view === "catalog" ? <><div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
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
          {canManageCatalog ? <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}><PlusIcon className="size-4" />{t("add")}</Button> : null}
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
                <th className="px-4 py-3">{t("columns.price")}</th>
                <th className="px-4 py-3">{t("statusLabel")}</th>
                <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-admin-muted">{t("empty")}</td></tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AdminNailDesignThumbnail imageUrl={row.thumbnailUrl} mediaId={row.mediaIds[0]} alt={row.title} />
                        <span className="font-medium text-admin-ink">{row.title}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-admin-ink">
                      {row.indicativePrice === null ? t("priceMissing") : formatMoney(row.indicativePrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageCatalog ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>{t("edit")}</Button>
                          <Button isIconOnly size="sm" variant="ghost" className="rounded-lg text-admin-danger" aria-label={t("deleteDesign", { name: row.title })} onPress={() => setDeleting(row)}>
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>{t("pagination", { shown: visible.length, total: filtered.length })}</span>
          <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </Card.Footer>
      </Card></> : <ProposalList data={proposals.data?.items ?? []} isLoading={proposals.isLoading} error={proposals.error} canReview={canReviewProposals} onReview={(proposal, decision) => setReviewing({ proposal, decision })} />}

      {canManageCatalog && creating ? <DesignModal design={null} onClose={() => setCreating(false)} onSaved={syncSavedDesign} /> : null}
      {canManageCatalog && editing ? <DesignModal design={editing} onClose={() => setEditing(null)} onSaved={syncSavedDesign} /> : null}
      {canManageCatalog && deleting ? <DesignDeleteModal design={deleting} onClose={() => setDeleting(null)} onDeleted={() => void mutate()} /> : null}
      {canReviewProposals && reviewing ? <ProposalReviewModal proposal={reviewing.proposal} decision={reviewing.decision} onClose={() => setReviewing(null)} onSaved={() => { void proposals.mutate(); void mutate(); }} /> : null}
    </AdminPageLayout>
  );
}

function ProposalList({ data, isLoading, error, canReview, onReview }: Readonly<{ data: ReadonlyArray<AdminNailDesignProposal>; isLoading: boolean; error: unknown; canReview: boolean; onReview: (proposal: AdminNailDesignProposal, decision: "APPROVE" | "REJECT") => void }>) {
  const tp = useTranslations("admin.nailDesigns.proposals");
  const format = useFormatter();
  if (isLoading) return <p className="text-sm text-admin-muted">{tp("loading")}</p>;
  if (error) return <p role="alert" className="text-sm text-admin-danger">{tp("loadFailed")}</p>;
  if (data.length === 0) return <p className="rounded-lg border border-admin-border bg-admin-surface px-4 py-10 text-center text-sm text-admin-muted">{tp("empty")}</p>;
  return <div className="grid gap-3 lg:grid-cols-2">{data.map((proposal) => {
    const raw = proposal as Readonly<Record<string, unknown>>;
    const payload = proposal.payload ?? {};
    const title = [payload.title, payload.nameVi, raw.title, raw.nameVi].find((value): value is string => typeof value === "string") ?? tp("untitled");
    const mediaValue = Array.isArray(payload.mediaIds) ? payload.mediaIds : raw.mediaIds;
    const mediaId = Array.isArray(mediaValue) && typeof mediaValue[0] === "string" ? mediaValue[0] : undefined;
    return <Card key={proposal.proposalId} className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none"><Card.Content className="flex gap-3 p-4"><AdminNailDesignThumbnail mediaId={mediaId} alt={title} /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-admin-ink">{title}</p><p className="mt-1 text-xs text-admin-muted">{tp("createdAt", { value: proposal.createdAt ? format.dateTime(new Date(proposal.createdAt), { dateStyle: "short", timeStyle: "short" }) : tp("unknownDate") })}</p>{canReview ? <div className="mt-3 flex gap-2"><Button size="sm" variant="primary" onPress={() => onReview(proposal, "APPROVE")}>{tp("approve")}</Button><Button size="sm" variant="outline" className="border-admin-danger text-admin-danger" onPress={() => onReview(proposal, "REJECT")}>{tp("reject")}</Button></div> : null}</div></Card.Content></Card>;
  })}</div>;
}

export const meta = { world: "connected", domain: "admin-nail-designs" } as const;
