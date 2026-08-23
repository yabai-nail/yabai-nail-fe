"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { useAdminServices, type AdminServiceItem as ServerService } from "@/service";
import { ServiceSidebar } from "./ServiceSidebar";
import { ServiceTable } from "./ServiceTable";
import {
  categoryLabels,
  filterServices,
  paginateServices,
  salonServices as fixtureServices,
  type SalonService,
  type ServiceCategory,
  type ServiceFilter,
} from "./data";
const pageSize = 8;

// Category is a fixture-only concept — the backend doesn't classify services
// as primary/addon/combo yet, so imported services default to "primary" and
// the tab filters land them there.
function toFixtureService(server: ServerService): SalonService {
  const record = server as unknown as Record<string, unknown>;
  const rawCategory = typeof record.category === "string" ? record.category : "primary";
  const category = ["primary", "addon", "combo"].includes(rawCategory)
    ? (rawCategory as ServiceCategory)
    : "primary";
  const soldRaw = record.soldCount;
  return {
    id: server.id,
    name: server.name,
    category,
    price: server.priceVnd,
    durationMinutes: server.durationMinutes,
    isVisible: server.active,
    soldCount: typeof soldRaw === "number" ? soldRaw : 0,
  };
}

export function AdminServicesComponent() {
  const { data, isLoading, error } = useAdminServices();
  const source = useMemo<ReadonlyArray<SalonService>>(() => {
    if (!data?.items) return fixtureServices;
    if (data.items.length === 0) return [];
    return data.items.map(toFixtureService);
  }, [data]);

  const [filter, setFilter] = useState<ServiceFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () => filterServices(source, filter, query),
    [source, filter, query],
  );
  const {
    items: visible,
    page: currentPage,
    pageCount,
  } = paginateServices(filtered, page, pageSize);
  const changeFilter = (value: ServiceFilter) => {
    setFilter(value);
    setPage(1);
  };

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 xl:flex-row xl:items-end xl:justify-between">
        <Tabs selectedKey={filter} onSelectionChange={(key) => changeFilter(String(key) as ServiceFilter)} variant="secondary">
          <Tabs.ListContainer className="max-w-full overflow-x-auto">
            <Tabs.List aria-label="Phân loại dịch vụ">
              <Tabs.Tab id="all">
                <AdminTabLabel count={source.length}>
                  Tất cả dịch vụ
                </AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              {Object.entries(categoryLabels).map(([id, label]) => (
                <Tabs.Tab key={id} id={id}>
                  <AdminTabLabel
                    count={source.filter((service) => service.category === id).length}
                  >
                    {label}
                  </AdminTabLabel>
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminSearchField label="Tìm dịch vụ" placeholder="Tìm kiếm dịch vụ..." value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
          <Button variant="primary" className="rounded-lg"><PlusIcon className="size-4" />Thêm dịch vụ</Button>
        </div>
      </div>
      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">Đang tải danh sách dịch vụ…</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được — hiển thị dữ liệu mẫu.</p>
      ) : null}
      <AdminSplitLayout asideWidth="sm" aside={<ServiceSidebar services={source} />}>
        <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
          <Card.Content className="min-w-0 p-0"><ServiceTable services={visible} /></Card.Content>
          <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
            <span>Hiển thị {visible.length} trong tổng số {filtered.length} dịch vụ</span>
            <div className="flex gap-1">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
                <Button key={value} size="sm" variant={currentPage === value ? "outline" : "ghost"} className={currentPage === value ? "min-w-9 rounded-lg border-admin-accent text-admin-accent" : "min-w-9"} onPress={() => setPage(value)}>{value}</Button>
              ))}
            </div>
          </Card.Footer>
        </Card>
      </AdminSplitLayout>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-services" } as const;
