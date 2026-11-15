"use client";

import { useTranslations } from "next-intl";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tabs } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSelectionBar } from "@/components/blocks/admin/AdminSelectionBar";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminServiceCategories,
  useAdminBranch,
  useAdminBranchList,
  useAdminServices,
  useAdminPermission,
  useAdminPriceTiers,
  type AdminServiceItem as ServerService,
  type AdminServiceItemPatch,
} from "@/service";
import { PriceTierPanel } from "@/components/pages/admin/AdminNailDesigns/PriceTierPanel";
import { AddonTable } from "./AddonTable";
import { groupAddonCatalog } from "./addon-groups";
import { CategoryTable } from "./CategoryTable";
import { ServiceCreateModal } from "./ServiceCreateModal";
import { ServiceDeleteModal } from "./ServiceDeleteModal";
import { ServiceEditModal } from "./ServiceEditModal";
import { ServiceSummaryCards } from "./ServiceSummaryCards";
import { ServiceTable } from "./ServiceTable";
import {
  getPopularityWindow,
  listServices,
  selectAddonServices,
  selectBaseServices,
  UNCATEGORIZED,
  type SalonService,
} from "./data";
import { useServiceListState, type ServiceListState } from "./useServiceListState";

// The category now comes from the backend, which resolves the stored key to the public one and
// sends the name alongside it. A null category means a row older than the NOT NULL column.
function toScreenService(server: ServerService): SalonService {
  return {
    id: server.id,
    name: server.name,
    nameJa: server.nameJa ?? null,
    description: server.description ?? "",
    highlights: server.highlights ?? [],
    category: server.categoryId ? { id: server.categoryId, name: server.categoryName ?? "" } : null,
    imageUrl: server.imageUrl ?? null,
    price: server.price,
    durationMinutes: server.durationMinutes,
    warrantyDays: server.warrantyDays ?? 0,
    isVisible: server.active,
    soldCount: server.soldCount ?? 0,
    isFeatured: server.isFeatured ?? false,
    isPinned: server.isPinned ?? false,
    serviceType: server.serviceType ?? "BASE",
    addonGroup: server.addonGroup ?? null,
    bookableStandalone: server.bookableStandalone ?? false,
    representsNoSelection: server.representsNoSelection ?? false,
    priceTierId: server.priceTierId ?? null,
    version: server.version,
    sale: server.sale ?? null,
  };
}

/** The row above a list: search and "clear filters" on the left, the create action on the right. */
function ListToolbar({
  list,
  searchLabel,
  searchPlaceholder,
  leading,
  action,
}: Readonly<{ list: ServiceListState; searchLabel: string; searchPlaceholder: string; leading?: ReactNode; action: ReactNode }>) {
  const tc = useTranslations("admin.common");
  return (
    <div className="mb-4 flex flex-col gap-2 border-b border-admin-border pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {leading}
        {/* Wider than the admin default and as tall as the select that can sit beside it. */}
        <AdminSearchField
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={list.query}
          onChange={list.setQuery}
          className="min-h-11 w-full rounded-lg sm:w-80 lg:w-[26rem]"
        />
        {list.isFiltered ? (
          <Button variant="ghost" className="rounded-lg text-admin-muted" onPress={list.clear}>
            <XMarkIcon className="size-4" />{tc("columnFilter.clearAll")}
          </Button>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** A list's table in its card, with the "showing x of y" line and the pagination underneath. */
function ListCard({
  summary,
  page,
  pageCount,
  onPageChange,
  children,
}: Readonly<{ summary: string; page: number; pageCount: number; onPageChange: (page: number) => void; children: ReactNode }>) {
  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Content className="min-w-0 p-0">{children}</Card.Content>
      <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
        <span>{summary}</span>
        <AdminPagination page={page} pageCount={pageCount} onPageChange={onPageChange} />
      </Card.Footer>
    </Card>
  );
}

type View = "services" | "categories" | "addons" | "tiers";

export function AdminServicesComponent() {
  const t = useTranslations("admin.services");
  const tBranch = useTranslations("admin.branchSelector");
  const router = useRouter();
  const { branchIds } = useAdminBranch();
  // Service/category CRUD changes the chain-wide catalogue. Branch-level
  // catalogue write is reserved for appointment actual-service adjustments.
  const canWrite = useAdminPermission("catalog.write.all");
  const popularityWindow = useMemo(() => getPopularityWindow(), []);
  // Each tab keeps its own search, filters, sort and page.
  const serviceList = useServiceListState();
  const addonList = useServiceListState();
  // The catalogue is org-wide, but a service is hidden for a branch its category excludes, so the
  // list needs its own branch scope. It opens on "every branch" — otherwise the console's active
  // branch can silently empty the table when its categories are scoped elsewhere — and the branch
  // list only carries the ones this admin may see, matching the header switcher's own scope.
  const [branchFilter, setBranchFilter] = useState<string>("");
  const branches = useAdminBranchList();
  const branchNameById = useMemo(
    () => new Map((branches.data?.items ?? []).map((branch) => [branch.id, branch.name] as const)),
    [branches.data],
  );
  // Column filters narrow this list on the client, so it stays unfiltered by category and also
  // serves the per-category counts in the filter checklist. Add-ons are read separately below.
  const { data, isLoading, error, mutate: mutateServices } = useAdminServices({
    branchId: branchFilter || undefined,
    from: popularityWindow.from,
    limit: 100,
    q: serviceList.query.trim() || undefined,
    to: popularityWindow.to,
  });
  const categories = useAdminServiceCategories();
  const categoryItems = useMemo(() => categories.data?.items ?? [], [categories.data]);
  // Two jobs, two surfaces: browsing the catalogue, and maintaining the categories it is filed
  // under. Sharing one screen keeps the counts honest without cramming both into one layout.
  const [view, setView] = useState<View>("services");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SalonService | null>(null);
  const [deleting, setDeleting] = useState<SalonService | null>(null);
  // Ticked services for "create a sale"; kept across search, filter, sort and page.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const source = useMemo<ReadonlyArray<SalonService>>(
    () => (data?.items ?? []).map(toScreenService),
    [data],
  );
  // Deliberately unfiltered: the list above narrows by category, and an add-on has no
  // category, so any active filter would empty this tab. Loaded up front rather than on tab
  // open, because the tab carries a count badge and a badge reading 0 until you click it is
  // worse than one extra list read. The key matches the create modal's own catalogue read,
  // so those two share a response.
  const addonQuery = useAdminServices();
  const allServices = useMemo(
    () => (addonQuery.data?.items ?? []).map(toScreenService),
    [addonQuery.data],
  );
  const addonServices = useMemo(
    () => selectAddonServices(allServices),
    [allServices],
  );
  // Add-ons have their own tab, so they are not rows of the service catalogue any more.
  const baseServices = useMemo(() => selectBaseServices(source), [source]);
  const allBaseServices = useMemo(() => selectBaseServices(allServices), [allServices]);

  // Pinned services go first whatever the sort, which is what pinning is for.
  const servicePage = listServices(baseServices, serviceList, { pinned: true });
  const addonPage = listServices(addonServices, addonList);
  const unfiledCount = baseServices.filter((service) => service.category === null).length;
  const categoryOptions = useMemo(
    () => [
      ...categoryItems.map((category) => ({
        value: category.id,
        label: category.nameVi ?? category.name,
        count: baseServices.filter((service) => service.category?.id === category.id).length,
      })),
      // Offered only while such rows exist: it is how an admin finds them to file them.
      ...(unfiledCount > 0 ? [{ value: UNCATEGORIZED, label: t("table.uncategorized"), count: unfiledCount }] : []),
    ],
    [categoryItems, baseServices, unfiledCount, t],
  );
  const addonGroupOptions = useMemo(
    () =>
      groupAddonCatalog(addonServices)
        .map(([code, addons]) => ({ value: code, label: code, count: addons.length }))
        .sort((left, right) => left.value.localeCompare(right.value)),
    [addonServices],
  );
  // The shared price tiers (Mức giá) are the nail-design ones; the API reads them with the
  // design permission, so without it the price stays a typed one and the tab is not offered.
  const canManageTiers = useAdminPermission("design.manage.all");
  const tierQuery = useAdminPriceTiers(canManageTiers);
  const tiers = useMemo(() => tierQuery.data?.items ?? [], [tierQuery.data]);
  const tierNames = useMemo(() => new Map(tiers.map((tier) => [tier.id, tier.name] as const)), [tiers]);
  const tierStatus = !canManageTiers ? "hidden" : tierQuery.isLoading ? "loading" : tierQuery.error ? "failed" : "ready";
  // Both reads show the same rows through different filters, so a write has to refresh each, and
  // the tiers too: linking or detaching a service changes a tier's service count.
  const refreshCatalogue = () => {
    void mutateServices();
    void addonQuery.mutate();
    if (canManageTiers) void tierQuery.mutate();
  };

  // A set rather than one id, so a second row can be changed while the first is still saving.
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());
  const [rowError, setRowError] = useState<string | null>(null);
  // A one-field change from a table row: the API keeps every other field from the stored row.
  // A refusal's own message is shown as-is, because it says which rule applied.
  const patchService = async (service: SalonService, patch: AdminServiceItemPatch, done: string, failed: string) => {
    setBusyIds((current) => new Set(current).add(service.id));
    setRowError(null);
    try {
      await adminService.updateService(service.id, patch, service.version);
      notifySuccess(done);
      refreshCatalogue();
    } catch (thrown) {
      setRowError(thrown instanceof Error && thrown.message ? thrown.message : failed);
    } finally {
      setBusyIds((current) => new Set([...current].filter((id) => id !== service.id)));
    }
  };
  // Hiding also drops "featured" server-side, and is refused while the service has open appointments.
  const toggleStatus = (service: SalonService) =>
    void patchService(
      service,
      { status: service.isVisible ? "INACTIVE" : "ACTIVE" },
      t(service.isVisible ? "table.hiddenSuccess" : "table.shownSuccess", { name: service.name }),
      t("table.statusFailed"),
    );
  // The pin only orders this admin table.
  const togglePin = (service: SalonService) =>
    void patchService(
      service,
      { isPinned: !service.isPinned },
      t(service.isPinned ? "table.unpinnedSuccess" : "table.pinnedSuccess", { name: service.name }),
      t("table.pinFailed"),
    );

  const createButton = (label: string) => (
    <Button variant="primary" className="rounded-lg" isDisabled={!canWrite} onPress={() => setIsCreateOpen(true)}>
      <PlusIcon className="size-4" />{label}
    </Button>
  );
  const notices = (loading: boolean, failed: boolean) => (
    <>
      {loading ? (
        <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
      ) : failed ? (
        <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : null}
      {rowError ? <p role="alert" className="mb-3 text-xs text-admin-danger">{rowError}</p> : null}
    </>
  );

  return (
    <AdminPageLayout>
      <Tabs selectedKey={view} onSelectionChange={(key) => setView(String(key) as View)} variant="secondary">
        <Tabs.ListContainer className="mb-4 w-fit max-w-full overflow-x-auto">
          <Tabs.List aria-label={t("viewLabel")}>
            <Tabs.Tab id="services">
              <AdminTabLabel count={baseServices.length}>{t("table.service")}</AdminTabLabel>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="categories">
              <AdminTabLabel count={categoryItems.length}>{t("categoriesTab")}</AdminTabLabel>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="addons">
              <AdminTabLabel count={addonServices.length}>{t("addonsTab.label")}</AdminTabLabel>
              <Tabs.Indicator />
            </Tabs.Tab>
            {canManageTiers ? (
              <Tabs.Tab id="tiers">
                <AdminTabLabel count={tiers.length}>{t("tiersTab")}</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            ) : null}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {view === "tiers" && canManageTiers ? (
        // The panel revalidates services, designs and tiers itself after each write.
        <PriceTierPanel tiers={tiers} isLoading={tierQuery.isLoading} failed={Boolean(tierQuery.error)} onChanged={() => undefined} />
      ) : view === "categories" ? (
        <CategoryTable services={allBaseServices} canWrite={canWrite} />
      ) : view === "addons" ? (
        <>
          <p className="mb-3 text-xs text-admin-muted">{t("addonsTab.description")}</p>
          <ListToolbar
            list={addonList}
            searchLabel={t("addonsTab.searchLabel")}
            searchPlaceholder={t("addonsTab.searchPlaceholder")}
            action={createButton(t("addonsTab.create"))}
          />
          {notices(addonQuery.isLoading, Boolean(addonQuery.error))}
          <ListCard
            summary={t("addonsTab.showing", { visible: addonPage.items.length, total: addonPage.total })}
            page={addonPage.page}
            pageCount={addonPage.pageCount}
            onPageChange={addonList.setPage}
          >
            <AddonTable
              services={addonPage.items}
              list={addonList}
              tierNames={tierNames}
              groupOptions={addonGroupOptions}
              emptyText={addonServices.length === 0 ? t("addonsTab.empty") : t("addonsTab.noMatch")}
              busyIds={busyIds}
              onToggleStatus={canWrite ? toggleStatus : undefined}
              onEdit={canWrite ? setEditing : undefined}
              onDelete={canWrite ? setDeleting : undefined}
            />
          </ListCard>
        </>
      ) : (
        <>
          <ServiceSummaryCards services={baseServices} />
          <ListToolbar
            list={serviceList}
            searchLabel={t("searchLabel")}
            searchPlaceholder={t("searchPlaceholder")}
            // Only when there is more than one branch to switch between, mirroring the header. The
            // catalogue is org-wide, so this narrows which branch's visibility the list reflects.
            leading={branchIds.length > 1 ? (
              <AdminSelectField
                label={t("branchFilter.label")}
                value={branchFilter}
                onChange={(value) => { setBranchFilter(value); setSelected(new Set()); serviceList.setPage(1); }}
                options={[
                  { value: "", label: t("branchFilter.all") },
                  ...branchIds.map((id) => ({ value: id, label: branchNameById.get(id) ?? tBranch("unnamed") })),
                ]}
              />
            ) : null}
            action={createButton(t("create.submit"))}
          />
          {notices(isLoading, Boolean(error))}
          {unfiledCount > 0 ? (
            <p role="status" className="mb-3 text-xs text-admin-danger">
              {t("uncategorizedWarning", { count: unfiledCount })}
            </p>
          ) : null}
          <ListCard
            summary={t("showing", { visible: servicePage.items.length, total: servicePage.total })}
            page={servicePage.page}
            pageCount={servicePage.pageCount}
            onPageChange={serviceList.setPage}
          >
            <ServiceTable
              services={servicePage.items}
              list={serviceList}
              tierNames={tierNames}
              categoryOptions={categoryOptions}
              // The search goes to the API, so an empty result under a search is "no match".
              emptyText={baseServices.length === 0 && !serviceList.isFiltered ? t("table.noServices") : t("table.empty")}
              busyIds={busyIds}
              selected={selected}
              onSelectedChange={setSelected}
              onToggleStatus={canWrite ? toggleStatus : undefined}
              onTogglePin={canWrite ? togglePin : undefined}
              onEdit={canWrite ? setEditing : undefined}
              onDelete={canWrite ? setDeleting : undefined}
            />
          </ListCard>
          {/* A direct child of the page, so its sticky bottom follows the page while it scrolls. */}
          {selected.size > 0 ? (
            <AdminSelectionBar
              count={selected.size}
              actionLabel={t("table.createSale")}
              onAction={() => router.push("/admin/sales?new=1&services=" + [...selected].join(","))}
              onClear={() => setSelected(new Set())}
            />
          ) : null}
        </>
      )}

      {canWrite && isCreateOpen ? (
        <ServiceCreateModal
          lockedServiceType={view === "addons" ? "ADD_ON" : undefined}
          tiers={tiers}
          tierStatus={tierStatus}
          onTiersStale={() => void tierQuery.mutate()}
          onClose={() => setIsCreateOpen(false)}
          onCreated={refreshCatalogue}
        />
      ) : null}
      {canWrite && editing ? (
        <ServiceEditModal
          service={editing}
          tiers={tiers}
          tierStatus={tierStatus}
          onTiersStale={() => void tierQuery.mutate()}
          onClose={() => setEditing(null)}
          onSaved={refreshCatalogue}
        />
      ) : null}
      {canWrite && deleting ? (
        <ServiceDeleteModal
          service={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            const removed = deleting.id;
            setSelected((current) => new Set([...current].filter((id) => id !== removed)));
            refreshCatalogue();
          }}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-services" } as const;
