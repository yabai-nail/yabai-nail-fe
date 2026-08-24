"use client";

import { ChevronDownIcon, ChevronUpIcon, PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { adminService, useAdminServiceCategories, type AdminServiceCategory } from "@/service";
import { CategoryEditor } from "./CategoryEditor";
import { PromotionsPanel } from "./PromotionsPanel";
import { SurchargePanel } from "./SurchargePanel";
import { categoryLabels, type SalonService, type ServiceCategory } from "./data";

export function ServiceSidebar({ services }: Readonly<{ services: ReadonlyArray<SalonService> }>) {
  const categories: ReadonlyArray<{ id: "all" | ServiceCategory; label: string }> = [
    { id: "all", label: "Tất cả" },
    ...Object.entries(categoryLabels).map(([id, label]) => ({ id: id as ServiceCategory, label })),
  ];
  const topServices = [...services].sort((left, right) => right.soldCount - left.soldCount).slice(0, 5);

  // BE-backed categories live alongside the fixture filter tabs — those
  // remain the local UI filter (primary/addon/combo), while this section
  // is the source of truth for what the salon actually manages.
  const beCategories = useAdminServiceCategories();
  // Sorted by the backend sortOrder so the up/down controls act on the same
  // order the customer-facing catalog renders.
  const beItems = useMemo(
    () => [...(beCategories.data?.items ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
    [beCategories.data],
  );
  const [editing, setEditing] = useState<AdminServiceCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  // Nudge one category up/down and persist the whole order. Simpler and more
  // accessible than drag-and-drop, and it needs no extra dependency.
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= beItems.length || reordering) return;
    const next = [...beItems];
    [next[index], next[target]] = [next[target], next[index]];
    setReordering(true);
    setReorderError(null);
    try {
      await adminService.reorderServiceCategories({
        orderedCategoryIds: next.map((category) => category.id),
      });
      await beCategories.mutate();
    } catch (thrown) {
      setReorderError(thrown instanceof Error ? thrown.message : "Không lưu được thứ tự danh mục.");
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="px-4 pt-4"><h2 className="font-bold">Danh mục dịch vụ</h2></Card.Header>
        <Card.Content className="p-4">
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${category.id === "all" ? "bg-admin-soft font-semibold text-admin-accent" : ""}`}>
                <span>{category.label}</span>
                <strong>{category.id === "all" ? services.length : services.filter((service) => service.category === category.id).length}</strong>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-admin-border pt-3">
            <p className="mb-2 text-[0.65rem] uppercase tracking-wide text-admin-muted">
              Danh mục lưu trên hệ thống
            </p>
            {beCategories.isLoading ? (
              <p className="text-xs text-admin-muted">Đang tải…</p>
            ) : beCategories.error ? (
              <p role="alert" className="text-xs text-admin-danger">Không tải được danh mục.</p>
            ) : beItems.length === 0 ? (
              <p className="text-xs text-admin-muted">Chưa có danh mục nào trên hệ thống.</p>
            ) : (
              <ul className="space-y-1">
                {beItems.map((category, index) => (
                  <li key={category.id} className="flex items-center justify-between gap-1 rounded-lg px-2 py-1 text-xs hover:bg-admin-soft">
                    <span className="min-w-0 flex-1 truncate">
                      <strong className="text-admin-ink">{category.nameVi ?? category.name}</strong>
                      <span className="ml-2 text-admin-muted">({category.code})</span>
                    </span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Đưa ${category.name} lên trên`}
                      isDisabled={index === 0 || reordering}
                      onPress={() => void move(index, -1)}
                    >
                      <ChevronUpIcon className="size-3.5" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Đưa ${category.name} xuống dưới`}
                      isDisabled={index === beItems.length - 1 || reordering}
                      onPress={() => void move(index, 1)}
                    >
                      <ChevronDownIcon className="size-3.5" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Đổi tên ${category.name}`}
                      onPress={() => setEditing(category)}
                    >
                      <PencilSquareIcon className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {reorderError ? <p role="alert" className="mt-2 text-xs text-admin-danger">{reorderError}</p> : null}
          </div>

          <Button
            fullWidth
            variant="outline"
            className="mt-3 rounded-lg border-admin-accent/30 text-admin-accent"
            onPress={() => setCreating(true)}
          >
            <PlusIcon className="size-4" />Thêm danh mục
          </Button>
        </Card.Content>
      </Card>
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="px-4 pt-4"><h2 className="font-bold">Top dịch vụ bán chạy</h2></Card.Header>
        <Card.Content className="p-4">
          <ol className="space-y-3">
            {topServices.map((service, index) => (
              <li key={service.id} className="grid grid-cols-[1.5rem_2.5rem_1fr] items-center gap-2 text-sm">
                <span className="font-bold text-admin-accent">{index + 1}</span>
                <span aria-hidden="true" className="size-10 rounded-lg bg-gradient-to-br from-pink-100 to-amber-50" />
                <span><strong className="block text-xs">{service.name}</strong><span className="text-xs text-admin-accent">{service.soldCount} lượt</span></span>
              </li>
            ))}
          </ol>
        </Card.Content>
      </Card>
      <SurchargePanel />
      <PromotionsPanel />
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="p-4"><h2 className="font-bold">Ghi chú</h2><p className="mt-2 text-xs leading-5 text-admin-muted">Bạn có thể ẩn/hiện dịch vụ tại trang đặt lịch. Các dịch vụ ẩn sẽ không hiển thị cho khách hàng.</p></Card.Content>
      </Card>

      {(creating || editing) ? (
        <CategoryEditor
          category={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => void beCategories.mutate()}
        />
      ) : null}
    </div>
  );
}
