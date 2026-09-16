"use client";

import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Autocomplete, Button, Card, ListBox, SearchField, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import {
  useAdminServiceCategories,
  useAdminBranch,
  useAdminServices,
  useAdminPermission,
  type AdminServiceItem as ServerService,
} from "@/service";
import { CategoryTable } from "./CategoryTable";
import { ServiceCreateModal } from "./ServiceCreateModal";
import { ServiceDeleteModal } from "./ServiceDeleteModal";
import { ServiceEditModal } from "./ServiceEditModal";
import { ServiceSidebar } from "./ServiceSidebar";
import { ServiceTable } from "./ServiceTable";
import {
  filterServices,
  getPopularityWindow,
  paginate,
  type SalonService,
  type ServiceFilter,
} from "./data";

const pageSize = 8;

// The category now comes from the backend, which resolves the stored key to the public one and
// sends the name alongside it. A null category means a row older than the NOT NULL column.
function toScreenService(server: ServerService): SalonService {
  return {
    id: server.id,
    name: server.name,
    category: server.categoryId ? { id: server.categoryId, name: server.categoryName ?? "" } : null,
    imageUrl: server.imageUrl ?? null,
    price: server.price,
    durationMinutes: server.durationMinutes,
    isVisible: server.active,
    soldCount: server.soldCount ?? 0,
    isFeatured: server.isFeatured ?? false,
    serviceType: server.serviceType ?? "BASE",
    addonGroup: server.addonGroup ?? null,
    bookableStandalone: server.bookableStandalone ?? false,
    version: server.version,
  };
}

export function AdminServicesComponent() {
  const t = useTranslations("admin.services");
  const { branchId } = useAdminBranch();
  const canWrite = useAdminPermission("catalog.write.branch", "catalog.write.all");
  const popularityWindow = useMemo(() => getPopularityWindow(), []);
  const [filter, setFilter] = useState<ServiceFilter>("all");
  const [query, setQuery] = useState("");
  const { data, isLoading, error, mutate: mutateServices } = useAdminServices({
    branchId: branchId ?? undefined,
    categoryId: filter === "all" ? undefined : filter,
    from: popularityWindow.from,
    limit: 100,
    q: query.trim() || undefined,
    to: popularityWindow.to,
  });
  const categories = useAdminServiceCategories();
  const categoryItems = categories.data?.items ?? [];
  // Two jobs, two surfaces: browsing the catalogue, and maintaining the categories it is filed
  // under. Sharing one screen keeps the counts honest without cramming both into one layout.
  const [view, setView] = useState<"services" | "categories">("services");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SalonService | null>(null);
  const [deleting, setDeleting] = useState<SalonService | null>(null);
  const source = useMemo<ReadonlyArray<SalonService>>(
    () => (data?.items ?? []).map(toScreenService),
    [data],
  );

  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () => filterServices(source, filter, query),
    [source, filter, query],
  );
  const {
    items: visible,
    page: currentPage,
    pageCount,
  } = paginate(filtered, page, pageSize);
  const changeFilter = (value: ServiceFilter) => {
    setFilter(value);
    setPage(1);
  };
  const unfiledCount = source.filter((service) => service.serviceType !== "ADD_ON" && service.category === null).length;
  const countIn = (categoryId: string) => source.filter((service) => service.category?.id === categoryId).length;

  return (
    <AdminPageLayout>
      <Tabs selectedKey={view} onSelectionChange={(key) => setView(String(key) as "services" | "categories")} variant="secondary">
        <Tabs.ListContainer className="mb-4 w-fit max-w-full overflow-x-auto">
          <Tabs.List aria-label={t("viewLabel")}>
            <Tabs.Tab id="services">
              <AdminTabLabel count={source.length}>{t("table.service")}</AdminTabLabel>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="categories">
              <AdminTabLabel count={categoryItems.length}>{t("categoriesTab")}</AdminTabLabel>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {view === "categories" ? (
        <CategoryTable services={source} canWrite={canWrite} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 border-b border-admin-border pb-3 sm:flex-row sm:items-center sm:justify-between">
            {/*
              One control instead of a strip of them. The open list carries its own search box, so
              the number of categories stops mattering to the layout: the toolbar is one row whether
              the salon keeps four categories or forty.
            */}
            <Autocomplete
              aria-label={t("filterCategory")}
              selectedKey={filter}
              onSelectionChange={(key) => {
                if (typeof key === "string") changeFilter(key);
              }}
              className="w-full sm:w-72"
            >
              <Autocomplete.Trigger className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 text-left text-sm font-medium text-admin-ink outline-none hover:bg-admin-soft focus-visible:ring-2 focus-visible:ring-admin-accent">
                <span className="shrink-0 text-admin-muted">{t("categoryPrefix")}</span>
                <Autocomplete.Value className="flex-1 truncate" />
                <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-admin-muted" />
              </Autocomplete.Trigger>
              {/*
                `admin-shell` is required, not decorative: the popover portals out of the admin
                subtree and loses every --admin-* token without it. AdminSelectField carries it for
                the same reason.
              */}
              <Autocomplete.Popover placement="bottom start" className="admin-shell">
                {/*
                  react-aria filters nothing on its own: without this predicate the search box
                  takes keystrokes and the list ignores them. Matching lowercases but keeps
                  diacritics, the same rule every other admin list search follows.
                */}
                <Autocomplete.Filter
                  filter={(textValue, inputValue) =>
                    textValue
                      .toLocaleLowerCase("vi")
                      .includes(inputValue.trim().toLocaleLowerCase("vi"))
                  }
                >
                  <SearchField aria-label={t("categorySearchLabel")} autoFocus className="p-2">
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder={t("categorySearchPlaceholder")} />
                    </SearchField.Group>
                  </SearchField>
                  <ListBox aria-label={t("categoriesTab")} className="max-h-64 overflow-y-auto">
                    <ListBox.Item id="all" textValue={t("allServices")}>
                      {t("allServices")} · {source.length}
                    </ListBox.Item>
                    {categoryItems.map((category) => (
                      <ListBox.Item
                        key={category.id}
                        id={category.id}
                        textValue={category.nameVi ?? category.name}
                      >
                        {category.nameVi ?? category.name} · {countIn(category.id)}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Autocomplete.Filter>
              </Autocomplete.Popover>
            </Autocomplete>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminSearchField label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={!canWrite}
                onPress={() => setIsCreateOpen(true)}
              >
                <PlusIcon className="size-4" />{t("create.submit")}
              </Button>
            </div>
          </div>
          {isLoading ? (
            <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
          ) : error ? (
            <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
          ) : null}
          {unfiledCount > 0 ? (
            <p role="status" className="mb-3 text-xs text-admin-danger">
              {t("uncategorizedWarning", { count: unfiledCount })}
            </p>
          ) : null}
          <AdminSplitLayout asideWidth="sm" aside={<ServiceSidebar services={source} />}>
            <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
              <Card.Content className="min-w-0 p-0">
                <ServiceTable services={visible} onEdit={canWrite ? setEditing : undefined} onDelete={canWrite ? setDeleting : undefined} />
              </Card.Content>
              <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
                <span>{t("showing", { visible: visible.length, total: filtered.length })}</span>
                <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
              </Card.Footer>
            </Card>
          </AdminSplitLayout>
        </>
      )}

      {canWrite && isCreateOpen ? (
        <ServiceCreateModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void mutateServices()}
        />
      ) : null}
      {canWrite && editing ? (
        <ServiceEditModal
          service={editing}
          onClose={() => setEditing(null)}
          onSaved={() => void mutateServices()}
        />
      ) : null}
      {canWrite && deleting ? (
        <ServiceDeleteModal
          service={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => void mutateServices()}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-services" } as const;
