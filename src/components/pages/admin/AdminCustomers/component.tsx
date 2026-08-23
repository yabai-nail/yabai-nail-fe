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
import { useAdminBranch, useAdminCustomers, type AdminCustomer } from "@/service";
import { CustomerCreateModal } from "./CustomerCreateModal";
import { CustomerDetailPanel } from "./CustomerDetailPanel";
import { CustomerTable } from "./CustomerTable";
import { customers as fixtureCustomers, type Customer, type CustomerRank, type CustomerSegment } from "./data";

type CustomerFilter = "all" | CustomerSegment;

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/**
 * Server → fixture adapter. The API only exposes a small typed head
 * (`id`, `displayName`, `phone`, `status`, …); the fixture display carries
 * spend, points, birthdays and other rich fields the backend has not yet
 * standardised. We fill best-effort defaults and pass through anything the
 * backend happens to have sent via the `[field: string]: unknown` escape.
 */
function toFixtureCustomer(server: AdminCustomer): Customer {
  const name = server.displayName ?? server.name ?? `Khách #${server.id.slice(0, 6)}`;
  const record = server as unknown as Record<string, unknown>;
  const readNumber = (key: string): number => {
    const value = record[key];
    return typeof value === "number" ? value : 0;
  };
  const readString = (key: string): string => {
    const value = record[key];
    return typeof value === "string" ? value : "";
  };
  return {
    id: server.id,
    name,
    initials: deriveInitials(name),
    phone: server.phone ?? "",
    birthday: readString("birthday"),
    handle: readString("handle"),
    preference: readString("preference"),
    lastVisit: readString("lastVisit"),
    totalSpend: readNumber("totalSpend"),
    points: readNumber("points"),
    visits: readNumber("visits"),
    segment: (readString("segment") as CustomerSegment) || "regular",
    rank: (readString("rank") as CustomerRank) || "none",
    note: readString("note"),
  };
}

export function AdminCustomersComponent() {
  const { branchId } = useAdminBranch();
  const { data, isLoading, error, mutate: mutateCustomers } = useAdminCustomers(branchId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Fixture is the fallback while there is no branch (unauthenticated), the
  // request is in flight, or the endpoint errored. This keeps the layout
  // useful for design review; a real branch replaces the sample rows.
  const source = useMemo<ReadonlyArray<Customer>>(() => {
    if (!data?.items) return fixtureCustomers;
    if (data.items.length === 0) return [];
    return data.items.map(toFixtureCustomer);
  }, [data]);

  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return source.filter((customer) => (filter === "all" || customer.segment === filter) && (!normalizedQuery || `${customer.name} ${customer.phone}`.toLocaleLowerCase("vi").includes(normalizedQuery)));
  }, [source, filter, query]);
  const selectedCustomer = resolveVisibleSelection(filteredCustomers, selectedId || filteredCustomers[0]?.id || "");
  const totalLabel = data?.pageInfo?.limit ?? source.length;

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 xl:flex-row xl:items-end xl:justify-between">
        <Tabs selectedKey={filter} onSelectionChange={(key) => setFilter(String(key) as CustomerFilter)} variant="secondary">
          <Tabs.ListContainer className="max-w-full overflow-x-auto">
            <Tabs.List aria-label="Phân nhóm khách hàng">
              <Tabs.Tab id="all">
                <AdminTabLabel count={source.length}>Tất cả khách hàng</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="loyal">
                <AdminTabLabel count={source.filter((c) => c.segment === "loyal").length}>Khách thân thiết</AdminTabLabel>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="new">
                <AdminTabLabel count={source.filter((c) => c.segment === "new").length}>Khách mới</AdminTabLabel>
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
          <Button
            variant="primary"
            className="rounded-lg"
            isDisabled={!branchId}
            onPress={() => setIsCreateOpen(true)}
          >
            <PlusIcon className="size-4" />Thêm khách hàng
          </Button>
        </div>
      </div>
      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">Đang tải danh sách khách hàng…</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được — hiển thị dữ liệu mẫu.</p>
      ) : null}
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
          <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted"><span>Hiển thị 1 - {filteredCustomers.length} trong tổng số {totalLabel} khách hàng</span><div className="flex gap-1"><Button size="sm" variant="outline" className="min-w-9 rounded-lg border-admin-accent text-admin-accent">1</Button><Button size="sm" variant="ghost">2</Button><Button size="sm" variant="ghost">3</Button></div></Card.Footer>
        </Card>
      </AdminSplitLayout>
      {isCreateOpen && branchId ? (
        <CustomerCreateModal
          branchId={branchId}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void mutateCustomers()}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-customers" } as const;
