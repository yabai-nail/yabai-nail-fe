"use client";

import { useFormatter, useTranslations } from "next-intl";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tabs } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { AdminSelectionBar } from "@/components/blocks/admin/AdminSelectionBar";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { useAdminNailDesignProposals, useAdminNailDesigns, useAdminPriceTiers, useAuth, type AdminNailDesign, type AdminNailDesignProposal } from "@/service";
import { DesignModal } from "./DesignModal";
import { DesignDeleteModal } from "./DesignDeleteModal";
import { DesignTable, type SaleFilter } from "./DesignTable";
import { AdminNailDesignThumbnail } from "./AdminNailDesignThumbnail";
import { PriceTierPanel } from "./PriceTierPanel";
import { ProposalReviewModal } from "./ProposalReviewModal";
import {
  adaptDesign,
  CUSTOM_PRICE,
  designStatuses,
  filterDesigns,
  filterDesignsByTier,
  isOnSale,
  paginate,
  upsertDesignInList,
  type DesignRow,
} from "./data";

const pageSize = 8;
type View = "catalog" | "tiers" | "proposals";

export function AdminNailDesignsComponent() {
  const t = useTranslations("admin.nailDesigns");
  const tc = useTranslations("admin.common");
  const router = useRouter();
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
  // Tiers are read with the same permission as the catalogue they price.
  const tierQuery = useAdminPriceTiers(canManageCatalog);
  const tiers = useMemo(() => tierQuery.data?.items ?? [], [tierQuery.data]);
  const tierStatus = tierQuery.isLoading ? "loading" : tierQuery.error ? "failed" : "ready";
  const tierNames = useMemo(() => new Map(tiers.map((tier) => [tier.id, tier.name] as const)), [tiers]);

  const source = useMemo<ReadonlyArray<DesignRow>>(
    () => (data?.items ? data.items.map(adaptDesign) : []),
    [data],
  );

  const [page, setPage] = useState(1);
  const [tierFilter, setTierFilter] = useState<ReadonlyArray<string>>([]);
  const [saleFilter, setSaleFilter] = useState<SaleFilter>([]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<DesignRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DesignRow | null>(null);
  const [view, setView] = useState<View>(canManageCatalog ? "catalog" : "proposals");
  const [reviewing, setReviewing] = useState<{ proposal: AdminNailDesignProposal; decision: "APPROVE" | "REJECT" } | null>(null);

  const statuses = useMemo(
    () => Array.from(new Set(["ACTIVE", "ARCHIVED", "DRAFT", "HIDDEN", "PUBLISHED", ...designStatuses(source)])),
    [source],
  );
  const searched = useMemo(() => filterDesigns(source, status, query), [source, status, query]);
  const filtered = useMemo(() => {
    const byTier = filterDesignsByTier(searched, tierFilter, CUSTOM_PRICE);
    return saleFilter.length > 0 ? byTier.filter(isOnSale) : byTier;
  }, [searched, tierFilter, saleFilter]);
  // Counted over the searched rows, so a count matches what ticking that option shows.
  const tierOptions = useMemo(() => [
    ...tiers.map((tier) => ({ value: tier.id, label: tier.name, count: filterDesignsByTier(searched, [tier.id]).length })),
    { value: CUSTOM_PRICE, label: t("table.customPrice"), count: filterDesignsByTier(searched, [CUSTOM_PRICE]).length },
  ], [tiers, searched, t]);
  const isColumnFiltered = tierFilter.length > 0 || saleFilter.length > 0;
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);
  // A tier's count and a design's price follow each other, so a write to either refreshes both.
  const refreshPrices = () => {
    void tierQuery.mutate();
    void mutate();
  };
  const syncSavedDesign = async (saved: AdminNailDesign) => {
    await mutate((current) => upsertDesignInList(current, saved), { revalidate: false });
    refreshPrices();
  };

  return (
    <AdminPageLayout>
      <Tabs selectedKey={view} onSelectionChange={(key) => setView(String(key) as View)} variant="secondary">
        <Tabs.ListContainer className="mb-4 w-fit max-w-full overflow-x-auto">
          <Tabs.List aria-label={t("viewLabel")}>
            {canManageCatalog ? (
              <Tabs.Tab id="catalog">
                <AdminTabLabel count={source.length}>{t("catalogTab")}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            ) : null}
            {canManageCatalog ? (
              <Tabs.Tab id="tiers">
                <AdminTabLabel count={tiers.length}>{t("tiers.tab")}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            ) : null}
            {canReviewProposals ? (
              <Tabs.Tab id="proposals">
                <AdminTabLabel count={proposals.data?.items.length ?? 0}>{t("proposalsTab")}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            ) : null}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {view === "tiers" ? (
        <PriceTierPanel tiers={tiers} isLoading={tierQuery.isLoading} failed={Boolean(tierQuery.error)} onChanged={refreshPrices} />
      ) : view === "catalog" ? <><div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
          {isColumnFiltered ? (
            <Button variant="ghost" className="rounded-lg text-admin-muted" onPress={() => { setTierFilter([]); setSaleFilter([]); setPage(1); }}>
              <XMarkIcon className="size-4" />{tc("columnFilter.clearAll")}
            </Button>
          ) : null}
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

      <Card className="mb-4 min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 p-0">
          <DesignTable
            rows={visible}
            tierNames={tierNames}
            tierOptions={tierOptions}
            tierFilter={tierFilter}
            onTierFilterChange={(next) => { setTierFilter(next); setPage(1); }}
            saleFilter={saleFilter}
            onSaleFilterChange={(next) => { setSaleFilter(next); setPage(1); }}
            selected={selected}
            onSelectedChange={setSelected}
            emptyText={t("empty")}
            onEdit={canManageCatalog ? setEditing : undefined}
            onDelete={canManageCatalog ? setDeleting : undefined}
          />
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>{t("pagination", { shown: visible.length, total: filtered.length })}</span>
          <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </Card.Footer>
      </Card>
      {/* A direct child of the page, so its sticky bottom follows the page while it scrolls. */}
      {selected.size > 0 ? (
        <AdminSelectionBar
          count={selected.size}
          actionLabel={t("table.createSale")}
          onAction={() => router.push("/admin/sales?new=1&designs=" + [...selected].join(","))}
          onClear={() => setSelected(new Set())}
        />
      ) : null}</> : <ProposalList data={proposals.data?.items ?? []} isLoading={proposals.isLoading} error={proposals.error} canReview={canReviewProposals} onReview={(proposal, decision) => setReviewing({ proposal, decision })} />}

      {canManageCatalog && creating ? <DesignModal design={null} tiers={tiers} tierStatus={tierStatus} onClose={() => setCreating(false)} onSaved={syncSavedDesign} /> : null}
      {canManageCatalog && editing ? <DesignModal design={editing} tiers={tiers} tierStatus={tierStatus} onClose={() => setEditing(null)} onSaved={syncSavedDesign} /> : null}
      {canManageCatalog && deleting ? (
        <DesignDeleteModal
          design={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            const removed = deleting.id;
            setSelected((current) => new Set([...current].filter((id) => id !== removed)));
            refreshPrices();
          }}
        />
      ) : null}
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
