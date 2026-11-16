"use client";

import { BookmarkIcon, ExclamationTriangleIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { Button, Card, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { AdminColumnFilter } from "@/components/blocks/admin/AdminColumnFilter";
import type { AdminTableSort } from "@/lib/admin-table-sort";
import { isVersionConflict } from "@/components/pages/admin/AdminMarketing/home-announcements";
import { salesOnTier } from "@/components/pages/admin/AdminSales/data";
import { formatMoney } from "@/lib/admin-format";
import { paginate } from "@/lib/admin-pagination";
import { notifySuccess } from "@/lib/app-toast";
import { filterTiers, isPinnedTier, sortTierTable } from "@/lib/price-tier-search";
import { adminService, useAdminPermission, useAdminSales, useRevalidatePriceTierDependents, type AdminPriceTier } from "@/service";
import { PriceTierModal } from "./PriceTierModal";
import { usePriceTierPin } from "./usePriceTierPin";

const pageSize = 10;
const filters = ["all", "pinned"] as const;
type Filter = (typeof filters)[number];

/**
 * The "Mức giá" tab: the short list of ready-made prices a design or a service can sit on. Shown
 * on both the nail-design and the service screens. Every write revalidates the tiers, designs and
 * services wherever they are cached, because a tier's amount or removal also changes what is on
 * it; `onChanged` then runs for the host screen's own follow-up. Pinned tiers come first here and
 * in every tier picker; the list can be narrowed to them, searched by name or amount, and paged.
 */
export function PriceTierPanel({
  tiers,
  isLoading,
  failed,
  onChanged,
}: Readonly<{
  tiers: ReadonlyArray<AdminPriceTier>;
  isLoading: boolean;
  failed: boolean;
  onChanged: () => void;
}>) {
  const t = useTranslations("admin.nailDesigns.tiers");
  const revalidate = useRevalidatePriceTierDependents();
  const changed = () => { revalidate(); onChanged(); };
  // A pin changes no price, so only the cached tier lists need to reload.
  const pin = usePriceTierPin(revalidate);
  // `null` opens the form for a new tier; a tier opens it for editing.
  const [editing, setEditing] = useState<AdminPriceTier | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<AdminPriceTier | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<AdminTableSort<"name" | "amount"> | null>(null);
  const [amounts, setAmounts] = useState<ReadonlyArray<string>>([]);
  const sortProps = { sort, onSortChange: (next: AdminTableSort<"name" | "amount"> | null) => { setSort(next); setPage(1); } };
  // After a reload (e.g. on a version conflict) a retry must send the tier's fresh version.
  const latest = (tier: AdminPriceTier) => tiers.find((item) => item.id === tier.id) ?? tier;
  const pinnedCount = useMemo(() => tiers.filter(isPinnedTier).length, [tiers]);
  const amountOptions = useMemo(() => [...new Set(tiers.map((tier) => tier.amount))].sort((a, b) => a - b).map((amount) => ({ value: String(amount), label: formatMoney(amount) })), [tiers]);
  const shown = useMemo(() => sortTierTable(filterTiers(tiers, { query, pinnedOnly: filter === "pinned" }).filter((tier) => amounts.length === 0 || amounts.includes(String(tier.amount))), sort), [tiers, query, filter, amounts, sort]);
  const { items: visible, page: currentPage, pageCount } = paginate(shown, page, pageSize);
  const addButton = (
    <Button variant="primary" className="rounded-lg" onPress={() => setEditing(null)}>
      <PlusIcon className="size-4" />{t("add")}
    </Button>
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-5 text-admin-muted">{t("description")}</p>
        {addButton}
      </div>
      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
      ) : failed ? (
        <p role="alert" className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : null}
      {!isLoading && !failed && tiers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-admin-border bg-admin-surface px-4 py-12 text-center">
          <p role="status" className="max-w-md text-sm text-admin-muted">{t("empty")}</p>
          {addButton}
        </div>
      ) : tiers.length > 0 ? (
        <>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label={t("filterLabel")} className="flex w-fit rounded-lg border border-admin-border bg-admin-surface p-0.5">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={filter === item}
                  onClick={() => { setFilter(item); setPage(1); }}
                  className={`min-h-9 rounded-md px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${
                    filter === item ? "bg-admin-accent text-admin-on-accent" : "text-admin-muted hover:text-admin-ink"
                  }`}
                >
                  {t(`filter.${item}`)} <span className="tabular-nums">({item === "pinned" ? pinnedCount : tiers.length})</span>
                </button>
              ))}
            </div>
            <AdminSearchField
              label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(value) => { setQuery(value); setPage(1); }}
            />
          </div>
          {pin.error ? <p role="alert" className="mb-3 text-sm text-admin-danger">{pin.error}</p> : null}
          {visible.length === 0 ? (
            <p role="status" className="rounded-lg border border-admin-border bg-admin-surface px-4 py-8 text-center text-sm text-admin-muted">
              {filter === "pinned" && query.trim() === "" && amounts.length === 0 ? t("noPinned") : t("noMatch")}
            </p>
          ) : (
            <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
              <Card.Content className="min-w-0 overflow-x-auto p-0">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <caption className="sr-only">{t("caption")}</caption>
                  <thead className="border-b border-admin-border bg-admin-soft/60 text-xs font-semibold text-admin-ink">
                    <tr>
                      <AdminSortableHeader sortKey="name" {...sortProps} className="px-4">{t("columns.name")}</AdminSortableHeader>
                      <AdminSortableHeader sortKey="amount" {...sortProps} filter={
                        <AdminColumnFilter label={t("columns.amount")} options={amountOptions} selected={amounts} searchable onApply={(values) => { setAmounts(values); setPage(1); }} />
                      }>{t("columns.amount")}</AdminSortableHeader>
                      <AdminSortableHeader>{t("columns.designs")}</AdminSortableHeader>
                      <AdminSortableHeader>{t("columns.services")}</AdminSortableHeader>
                      <AdminSortableHeader>{t("columns.actions")}</AdminSortableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {visible.map((tier) => {
                      const pinned = isPinnedTier(tier);
                      const pinning = pin.pending.has(tier.id);
                      return (
                        <tr key={tier.id}>
                          <td className="px-4 py-2 font-medium text-admin-ink">
                            {tier.name}
                            {pinned ? (
                              <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-admin-soft px-2 py-0.5 align-middle text-xs font-semibold text-admin-muted">
                                <BookmarkSolidIcon aria-hidden className="size-3 text-admin-accent" />{t("pinned")}
                              </span>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-semibold">{formatMoney(tier.amount)}</td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">{t("designCount", { count: tier.designCount })}</td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">{t("serviceCount", { count: tier.serviceCount ?? 0 })}</td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <div className="flex gap-1">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                // A toggle keeps one label; aria-pressed says whether it is pinned.
                                aria-label={t("pin", { name: tier.name })}
                                aria-pressed={pinned}
                                aria-busy={pinning}
                                isDisabled={pinning}
                                className={pinned ? "text-admin-accent" : undefined}
                                onPress={() => void pin.toggle(latest(tier))}
                              >
                                {pinned ? <BookmarkSolidIcon className="size-4" /> : <BookmarkIcon className="size-4" />}
                              </Button>
                              <Button isIconOnly size="sm" variant="ghost" aria-label={t("editTier", { name: tier.name })} onPress={() => setEditing(tier)}>
                                <PencilSquareIcon className="size-4" />
                              </Button>
                              <Button isIconOnly size="sm" variant="ghost" className="text-admin-danger" aria-label={t("deleteTier", { name: tier.name })} onPress={() => setDeleting(tier)}>
                                <TrashIcon className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card.Content>
            </Card>
          )}
          <div className="mt-3 flex justify-end">
            <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} label={t("paginationLabel")} />
          </div>
        </>
      ) : null}

      {editing !== undefined ? <PriceTierModal tier={editing && latest(editing)} onClose={() => setEditing(undefined)} onSaved={changed} /> : null}
      {deleting ? <PriceTierDeleteModal tier={latest(deleting)} onClose={() => setDeleting(null)} onDeleted={changed} /> : null}
    </>
  );
}

/**
 * Says how many designs and services move to a typed price, so the owner knows none of them loses
 * its price, and how many sales picking designs by this tier stop covering it.
 */
function PriceTierDeleteModal({
  tier,
  onClose,
  onDeleted,
}: Readonly<{ tier: AdminPriceTier; onClose: () => void; onDeleted: () => void }>) {
  const t = useTranslations("admin.nailDesigns.tiers");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Without the sales permission there is nothing to read, and the sales line is left out.
  const sales = useAdminSales(useAdminPermission("promotion.read.all"));
  const saleCount = salesOnTier(sales.data?.items ?? [], tier.id);

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.deletePriceTier(tier.id, tier.version);
      notifySuccess(t("delete.success", { name: tier.name }));
      onDeleted();
      onClose();
    } catch (thrown) {
      // Changed in another tab: reload, so a retry carries the fresh version.
      const conflict = isVersionConflict(thrown);
      if (conflict) onDeleted();
      setError(conflict ? t("conflict") : t("delete.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog>
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-admin-soft text-admin-danger">
                <ExclamationTriangleIcon aria-hidden className="size-5" />
              </span>
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("delete.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-5 text-sm">
              <p className="leading-6 text-admin-ink">{t("delete.confirm", { name: tier.name })}</p>
              <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">
                {tier.designCount > 0
                  ? t("delete.inUse", { count: tier.designCount, amount: formatMoney(tier.amount) })
                  : t("delete.unused")}
              </p>
              {(tier.serviceCount ?? 0) > 0 ? (
                <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">
                  {t("delete.servicesInUse", { count: tier.serviceCount ?? 0, amount: formatMoney(tier.amount) })}
                </p>
              ) : null}
              {saleCount > 0 ? (
                <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">
                  {t("delete.sales", { count: saleCount })}
                </p>
              ) : null}
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("delete.cancel")}</Button>
              <Button
                variant="ghost"
                className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90"
                isDisabled={busy}
                onPress={() => void remove()}
              >
                {busy ? t("delete.deleting") : t("delete.action")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
