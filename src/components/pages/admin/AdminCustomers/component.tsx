"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { AdminTabLabel } from "@/components/blocks/admin/AdminTabLabel";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import { notifySuccess } from "@/lib/app-toast";
import { adminService, useAdminBranch, useAdminCustomer, useAdminCustomers, type AdminCustomer } from "@/service";
import { CustomerCreateModal } from "./CustomerCreateModal";
import { CustomerDetailPanel } from "./CustomerDetailPanel";
import { CustomerEditModal } from "./CustomerEditModal";
import { CustomerTable } from "./CustomerTable";
import type { Customer, CustomerRank, CustomerSegment } from "./data";

type CustomerFilter = "all" | CustomerSegment;

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/**
 * Server row → the shape this screen renders. The API only exposes a small
 * typed head (`id`, `displayName`, `phone`, `status`, …); the richer display
 * fields (spend, points, birthday) are read best-effort through the
 * `[field: string]: unknown` escape and fall back to blank rather than to an
 * invented value.
 */
function toCustomerRow(server: AdminCustomer): Customer {
  const name = server.displayName ?? server.name ?? "Khách chưa có tên";
  const record = server as unknown as Record<string, unknown>;
  const readNumber = (key: string): number => {
    const value = record[key];
    return typeof value === "number" ? value : 0;
  };
  const readString = (key: string): string => {
    const value = record[key];
    return typeof value === "string" ? value : "";
  };
  const rawSegment = readString("segment").toUpperCase();
  const rawRank = readString("membershipTier").toUpperCase();
  return {
    id: server.id,
    name,
    initials: deriveInitials(name),
    phone: server.phone ?? "",
    birthday: readString("birthday"),
    handle: readString("handle"),
    preference: readString("preferenceSummary"),
    lastVisit: readString("lastVisitAt"),
    totalSpend: readNumber("totalSpend"),
    points: readNumber("pointBalance"),
    visits: readNumber("visitCount"),
    segment:
      rawSegment === "NEW"
        ? "new"
        : rawSegment === "LOYAL" || rawRank === "GOLD" || rawRank === "SILVER"
          ? "loyal"
          : "regular",
    rank:
      rawRank === "GOLD" || rawRank === "SILVER" || rawRank === "BRONZE"
        ? (rawRank.toLowerCase() as CustomerRank)
        : "none",
    note: readString("note"),
    version: server.version,
    locale: server.locale,
    status: server.status,
  };
}

const pageSize = 8;

export function AdminCustomersComponent() {
  const { branchId } = useAdminBranch();
  const { data, isLoading, error, mutate: mutateCustomers } = useAdminCustomers(branchId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // No fixture fallback: with no branch, an in-flight request or a failed one
  // the list stays empty and the screen says so. A sample roster that looks
  // exactly like a real one is worse than an error message.
  const source = useMemo<ReadonlyArray<Customer>>(
    () => (data?.items ?? []).map(toCustomerRow),
    [data],
  );

  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [page, setPage] = useState(1);
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return source.filter((customer) => (filter === "all" || customer.segment === filter) && (!normalizedQuery || `${customer.name} ${customer.phone}`.toLocaleLowerCase("vi").includes(normalizedQuery)));
  }, [source, filter, query]);
  // The footer used to print `pageInfo.limit` as if it were the customer count
  // and render three hardcoded page buttons with no handler, so a branch with
  // two customers advertised twenty across three dead pages.
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstShown = filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const selectedCustomer = resolveVisibleSelection(visibleCustomers, selectedId || visibleCustomers[0]?.id || "");
  const customerDetail = useAdminCustomer(branchId, selectedCustomer?.id ?? null);
  const detailedCustomer = customerDetail.data ? toCustomerRow(customerDetail.data) : selectedCustomer;

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 xl:flex-row xl:items-end xl:justify-between">
        {/*
          min-w-0 is what makes the tabs' own overflow-x-auto work. Without it
          the tab strip is a flex item at min-width:auto, so it claims its full
          585px and never scrolls; the row then needs 1029px of the 973px it
          has, and the 56px it is short come off the right-hand end — the
          "Thêm khách hàng" button, cut in half, with the whole page scrolling
          sideways behind it.
        */}
        <Tabs className="min-w-0" selectedKey={filter} onSelectionChange={(key) => setFilter(String(key) as CustomerFilter)} variant="secondary">
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
        {/* shrink-0: when the row runs short the tabs give way, not the search
            box and the button. A tab strip that scrolls still works; a button
            sliced down the middle does not. */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {/* "Bộ lọc" was a button with no handler. The tabs above already filter by
              segment and the search box filters by name and phone; there was no third
              dimension for it to open, so it only ever looked like a control. */}
          <AdminSearchField label="Tìm khách hàng" placeholder="Tìm tên, SĐT..." value={query} onChange={setQuery} />
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
      {error ? (
        <p role="alert" className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          Không tải được danh sách khách hàng.
        </p>
      ) : null}
      {isLoading ? (
        <p className="py-6 text-center text-xs text-admin-muted">Đang tải danh sách khách hàng…</p>
      ) : source.length === 0 ? (
        <Card className="rounded-lg border-admin-border bg-admin-surface shadow-none">
          <Card.Content className="p-12 text-center">
            <h2 className="font-bold">Chưa có khách hàng</h2>
            <p className="mt-2 text-sm text-admin-muted">
              {error
                ? "Thử tải lại trang."
                : branchId
                  ? "Thêm khách hàng đầu tiên để bắt đầu theo dõi lịch sử và điểm tích luỹ."
                  : "Chọn chi nhánh để xem danh sách khách hàng."}
            </p>
          </Card.Content>
        </Card>
      ) : (
        <AdminSplitLayout
          aside={
            detailedCustomer ? (
              <CustomerDetailPanel
                customer={detailedCustomer}
                branchId={branchId}
                onEdit={
                  branchId && detailedCustomer.version !== undefined
                    ? () => {
                        setEditError(null);
                        setIsEditOpen(true);
                      }
                    : undefined
                }
              />
            ) : (
              <AdminEmptySelection
                title="Không có khách hàng"
                description="Thay đổi từ khóa hoặc nhóm khách hàng để xem chi tiết."
              />
            )
          }
        >
          <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Content className="min-w-0 p-0"><CustomerTable
              customers={visibleCustomers}
              selectedId={selectedCustomer?.id ?? null}
              onSelect={setSelectedId}
            /></Card.Content>
            <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted"><span>Hiển thị {firstShown} - {firstShown === 0 ? 0 : firstShown + visibleCustomers.length - 1} trong tổng số {filteredCustomers.length} khách hàng</span><AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} /></Card.Footer>
          </Card>
        </AdminSplitLayout>
      )}
      {isCreateOpen && branchId ? (
        <CustomerCreateModal
          branchId={branchId}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void mutateCustomers()}
        />
      ) : null}
      {isEditOpen && branchId && detailedCustomer ? (
        <CustomerEditModal
          customer={detailedCustomer}
          submitting={editSubmitting}
          error={editError}
          onClose={() => setIsEditOpen(false)}
          onConfirm={async (patch) => {
            setEditSubmitting(true);
            setEditError(null);
            try {
              await adminService.updateCustomer(
                branchId,
                detailedCustomer.id,
                patch,
                detailedCustomer.version,
              );
              notifySuccess("Đã cập nhật khách hàng");
              setIsEditOpen(false);
              void mutateCustomers();
            } catch (thrown) {
              setEditError(
                thrown instanceof Error ? thrown.message : "Không lưu được thông tin khách hàng.",
              );
            } finally {
              setEditSubmitting(false);
            }
          }}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-customers" } as const;
