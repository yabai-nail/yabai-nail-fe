"use client";

import { Bars3Icon, PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card, Switch } from "@heroui/react";
import { useState } from "react";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { adminService, useAdminBranchList, useAdminServiceCategories, type AdminServiceCategory } from "@/service";
import { notifySuccess } from "@/lib/app-toast";
import { CategoryEditor } from "./CategoryEditor";
import { filterCategories, moveCategory } from "./categories";
import { paginate, type SalonService } from "./data";

const pageSize = 10;

// The management surface for categories, at full page width. It sits here rather than in the
// right-hand column because that column is 17rem wide: names truncated to an ellipsis, and there
// was no room for the branch scope, the Japanese name or the on/off switch.
export function CategoryTable({ services }: Readonly<{ services: ReadonlyArray<SalonService> }>) {
  const categories = useAdminServiceCategories();
  const branches = useAdminBranchList();
  const ordered = categories.data?.items ?? [];
  const branchName = new Map((branches.data?.items ?? []).map((branch) => [branch.id, branch.name]));

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminServiceCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const filtered = filterCategories(ordered, query);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);
  // A search reorders nothing: the API wants the complete list, so a drag while filtered would
  // move a row against positions the screen is not showing.
  const canReorder = query.trim() === "";
  const absoluteIndexOf = (category: AdminServiceCategory) => ordered.findIndex((row) => row.id === category.id);
  const countIn = (categoryId: string) => services.filter((service) => service.category?.id === categoryId).length;
  // Naming all four branches says no more than "Tất cả" does, and it cost half the table width.
  // Past two names the count carries the meaning; the full list stays in the tooltip.
  const branchLabel = (scope: ReadonlyArray<string>) => {
    const total = branchName.size;
    if (scope.length === 0 || (total > 0 && scope.length >= total)) return "Tất cả";
    if (scope.length > 2) return `${scope.length} chi nhánh`;
    return scope.map((id) => branchName.get(id) ?? id).join(", ");
  };
  const branchTitle = (scope: ReadonlyArray<string>) =>
    scope.length ? scope.map((id) => branchName.get(id) ?? id).join(", ") : "Mọi chi nhánh";

  const applyOrder = async (from: number, to: number) => {
    const orderedCategoryIds = moveCategory(ordered.map((category) => category.id), from, to);
    if (orderedCategoryIds.every((id, index) => id === ordered[index]?.id)) return;
    setError(null);
    try {
      await adminService.reorderServiceCategories({ orderedCategoryIds });
      notifySuccess("Đã cập nhật thứ tự danh mục");
      void categories.mutate();
    } catch (thrown) {
      setError(thrown instanceof Error && thrown.message ? thrown.message : "Không đổi được thứ tự.");
    }
  };

  const toggleStatus = async (category: AdminServiceCategory) => {
    const next = category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusyId(category.id);
    setError(null);
    try {
      await adminService.updateServiceCategory(category.id, { status: next }, category.version);
      notifySuccess(next === "ACTIVE" ? "Đã bật danh mục" : "Đã tắt danh mục");
      void categories.mutate();
    } catch (thrown) {
      setError(thrown instanceof Error && thrown.message ? thrown.message : "Không đổi được trạng thái.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <AdminSearchField label="Tìm danh mục" placeholder="Tìm theo tên hoặc mã..." value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
          <PlusIcon className="size-4" />Thêm danh mục
        </Button>
      </div>
      {categories.error ? <p role="alert" className="mb-3 text-xs text-admin-danger">Không tải được danh mục.</p> : null}
      {error ? <p role="alert" className="mb-3 text-xs text-admin-danger">{error}</p> : null}
      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <caption className="sr-only">Danh mục dịch vụ</caption>
              <thead className="border-b border-admin-border text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Thứ tự</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Tên</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Mã</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Nhật ngữ</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Chi nhánh</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Dịch vụ</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Trạng thái</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {visible.map((category) => {
                  const index = absoluteIndexOf(category);
                  const scope = category.branchIds ?? [];
                  // Lifted, not faded: the row you are holding is the one you need to keep reading.
                  const lifted = dragFrom === index;
                  const marked = dragOver === index && dragFrom !== null && dragFrom !== index;
                  const insertAbove = marked && (dragFrom as number) > index;
                  const rowClass = [
                    "transition-colors duration-150",
                    canReorder ? "cursor-grab" : "",
                    lifted ? "bg-admin-soft shadow-sm ring-1 ring-inset ring-admin-accent/50" : "",
                    marked ? (insertAbove ? "border-t-2 border-admin-accent" : "border-b-2 border-admin-accent") : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <tr
                      key={category.id}
                      draggable={canReorder}
                      onDragStart={(event) => {
                        setDragFrom(index);
                        event.dataTransfer.effectAllowed = "move";
                        // Firefox refuses to begin a drag at all unless the payload is set here.
                        event.dataTransfer.setData("text/plain", category.id);
                      }}
                      onDragOver={(event) => {
                        if (!canReorder || dragFrom === null) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        if (dragOver !== index) setDragOver(index);
                      }}
                      onDrop={() => {
                        if (dragFrom !== null && dragFrom !== index) void applyOrder(dragFrom, index);
                        setDragFrom(null);
                        setDragOver(null);
                      }}
                      onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                      className={rowClass || undefined}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Bars3Icon aria-hidden="true" className={`size-4 ${canReorder ? "cursor-grab text-admin-muted" : "text-admin-border"}`} />
                          <span className="tabular-nums text-admin-muted">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2"><strong className="text-admin-ink">{category.nameVi ?? category.name}</strong></td>
                      <td className="px-3 py-2 text-admin-muted">{category.code}</td>
                      <td className="px-3 py-2 text-admin-muted">{category.nameJa || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-admin-muted" title={branchTitle(scope)}>
                        {branchLabel(scope)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{countIn(category.id)}</td>
                      <td className="px-3 py-2">
                        <Switch
                          isSelected={category.status === "ACTIVE"}
                          isDisabled={busyId === category.id}
                          onChange={() => void toggleStatus(category)}
                          aria-label={`Bật hoặc tắt danh mục ${category.nameVi ?? category.name}`}
                        >
                          <Switch.Content>
                            {/*
                              The track widens to hold its own label, so the row needs no second
                              piece of text saying the same thing. HeroUI slides the thumb with
                              `margin-inline-start: calc(100% - 1.5rem)`, a percentage, so it still
                              lands flush against the right edge at any width. The width is inline
                              rather than a utility class because both are single-class selectors and
                              which one wins would depend on CSS layer order.
                            */}
                            <Switch.Control style={{ width: "4.25rem" }}>
                              <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center text-[0.625rem] font-semibold uppercase tracking-wide">
                                {category.status === "ACTIVE" ? (
                                  <span className="pl-2.5 text-white">Bật</span>
                                ) : (
                                  <span className="ml-auto pr-2.5 text-admin-muted">Tắt</span>
                                )}
                              </span>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch.Content>
                        </Switch>
                      </td>
                      <td className="px-3 py-2">
                        <Button isIconOnly size="sm" variant="ghost" aria-label={`Sửa ${category.name}`} onPress={() => setEditing(category)}>
                          <PencilSquareIcon className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {categories.isLoading ? (
              <p role="status" className="p-12 text-center text-sm text-admin-muted">Đang tải danh mục…</p>
            ) : visible.length === 0 ? (
              <p role="status" className="p-12 text-center text-sm text-admin-muted">
                {ordered.length === 0 ? "Chưa có danh mục nào. Thêm một danh mục để tạo được dịch vụ." : "Không tìm thấy danh mục phù hợp."}
              </p>
            ) : null}
          </div>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>
            {filtered.length} danh mục
            {canReorder ? null : " · xoá ô tìm kiếm để đổi được thứ tự"}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, offset) => offset + 1).map((value) => (
              <Button key={value} size="sm" variant={currentPage === value ? "outline" : "ghost"} className={currentPage === value ? "min-w-9 rounded-lg border-admin-accent text-admin-accent" : "min-w-9"} onPress={() => setPage(value)}>{value}</Button>
            ))}
          </div>
        </Card.Footer>
      </Card>
      {(creating || editing) ? (
        <CategoryEditor
          category={editing}
          services={services}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => void categories.mutate()}
        />
      ) : null}
    </>
  );
}
