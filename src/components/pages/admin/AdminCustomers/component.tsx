"use client";

import { FunnelIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import { CustomerDetailPanel } from "./CustomerDetailPanel";
import { CustomerTable } from "./CustomerTable";
import { customers, type CustomerSegment } from "./data";

type CustomerFilter = "all" | CustomerSegment;

export function AdminCustomersComponent() {
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(customers[0].id);
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return customers.filter((customer) => (filter === "all" || customer.segment === filter) && (!normalizedQuery || `${customer.name} ${customer.phone}`.toLocaleLowerCase("vi").includes(normalizedQuery)));
  }, [filter, query]);
  const selectedCustomer = resolveVisibleSelection(filteredCustomers, selectedId);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 xl:flex-row xl:items-end xl:justify-between">
        <Tabs selectedKey={filter} onSelectionChange={(key) => setFilter(String(key) as CustomerFilter)} variant="secondary">
          <Tabs.ListContainer className="max-w-full overflow-x-auto">
            <Tabs.List aria-label="Phân nhóm khách hàng">
              <Tabs.Tab id="all">
                <AdminTabLabel count={128}>Tất cả khách hàng</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="loyal">
                <AdminTabLabel count={28}>Khách thân thiết</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="new">
                <AdminTabLabel count={42}>Khách mới</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="regular">
                <AdminTabLabel>Khách lâu năm</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminSearchField label="Tìm khách hàng" placeholder="Tìm tên, SĐT..." value={query} onChange={setQuery} />
          <Button variant="outline" className="rounded-lg border-admin-border"><FunnelIcon className="size-4" />Bộ lọc</Button>
          <Button variant="primary" className="rounded-lg"><PlusIcon className="size-4" />Thêm khách hàng</Button>
        </div>
      </div>
      <AdminSplitLayout
        aside={
          selectedCustomer ? (
            <CustomerDetailPanel customer={selectedCustomer} />
          ) : (
            <AdminEmptySelection
              title="Không có khách hàng"
              description="Thay đổi từ khóa hoặc nhóm khách hàng để xem chi tiết."
            />
          )
        }
      >
        <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
          <Card.Content className="min-w-0 p-0"><CustomerTable customers={filteredCustomers} selectedId={selectedCustomer?.id ?? null} onSelect={setSelectedId} /></Card.Content>
          <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted"><span>Hiển thị 1 - {filteredCustomers.length} trong tổng số 128 khách hàng</span><div className="flex gap-1"><Button size="sm" variant="outline" className="min-w-9 rounded-lg border-admin-accent text-admin-accent">1</Button><Button size="sm" variant="ghost">2</Button><Button size="sm" variant="ghost">3</Button></div></Card.Footer>
        </Card>
      </AdminSplitLayout>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-customers" } as const;
