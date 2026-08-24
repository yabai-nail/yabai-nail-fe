"use client";

import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSplitLayout } from "@/components/blocks/admin/AdminSplitLayout";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import { useAdminBranch, useAdminBranchReviews } from "@/service";
import { ReviewDetailPanel } from "./ReviewDetailPanel";
import { ReviewList } from "./ReviewList";
import {
  UNHANDLED_FILTER,
  collectHandlingStatuses,
  handlingStatusLabel,
  matchesHandlingFilter,
  toReviewRow,
  type ReviewRow,
} from "./normalize";

const PAGE_SIZE = 20;

export function AdminReviewsComponent() {
  const { branchId } = useAdminBranch();

  // Cursor pagination: every entry is the cursor that opened the page at that
  // depth, so "Trang trước" is a pop rather than a refetch from page one.
  // Keyed by branch so switching branches starts at page one without an
  // effect resetting state after the fact.
  const [cursorStacks, setCursorStacks] = useState<
    Readonly<Record<string, ReadonlyArray<string>>>
  >({});
  const [filter, setFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string>("");

  const branchKey = branchId ?? "";
  const cursorStack = cursorStacks[branchKey] ?? [];
  const setCursorStack = (next: (stack: ReadonlyArray<string>) => ReadonlyArray<string>) => {
    setCursorStacks((stacks) => ({ ...stacks, [branchKey]: next(stacks[branchKey] ?? []) }));
  };
  const cursor = cursorStack[cursorStack.length - 1];
  const query = useMemo(
    () => ({ limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) }),
    [cursor],
  );

  const { data, isLoading, error, mutate } = useAdminBranchReviews(branchId, query);

  const rows = useMemo<ReadonlyArray<ReviewRow>>(
    () => (data?.items ?? []).map(toReviewRow),
    [data],
  );
  const statusOptions = useMemo(() => collectHandlingStatuses(rows), [rows]);
  const visibleReviews = useMemo(
    () => rows.filter((row) => matchesHandlingFilter(row, filter)),
    [rows, filter],
  );
  const selected = resolveVisibleSelection(
    visibleReviews,
    selectedId || visibleReviews[0]?.id || "",
  );

  const pageInfo = data?.pageInfo;
  const hasNextPage = Boolean(pageInfo?.hasNextPage && pageInfo.endCursor);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-2 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <label htmlFor="review-handling-filter" className="text-sm font-semibold text-admin-ink">
          <span className="mb-1 block">Trạng thái xử lý</span>
          <select
            id="review-handling-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-h-9 rounded-lg border border-admin-border bg-admin-surface px-2 text-sm font-normal text-admin-ink outline-none focus:border-admin-accent"
          >
            <option value="all">Tất cả</option>
            <option value={UNHANDLED_FILTER}>Chưa xử lý</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {handlingStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        {/* The list operation takes no handling filter, so this narrows the
            page already loaded. Saying so beats a filter that silently lies. */}
        <p className="text-xs text-admin-muted">
          Bộ lọc áp dụng trong trang đang xem ({visibleReviews.length}/{rows.length} đánh giá).
        </p>
      </div>

      <AdminSplitLayout
        aside={
          selected && branchId ? (
            <ReviewDetailPanel
              key={selected.id}
              review={selected}
              branchId={branchId}
              statusOptions={statusOptions}
              onSaved={() => void mutate()}
            />
          ) : (
            <AdminEmptySelection
              title="Chưa chọn đánh giá"
              description="Chọn một đánh giá trong danh sách để trả lời khách và cập nhật trạng thái xử lý."
            />
          )
        }
      >
        <ReviewList
          reviews={visibleReviews}
          selectedId={selected?.id ?? null}
          isLoading={isLoading}
          errorMessage={error ? error.message : null}
          pageNumber={cursorStack.length + 1}
          hasPreviousPage={cursorStack.length > 0}
          hasNextPage={hasNextPage}
          onSelect={setSelectedId}
          onPreviousPage={() => setCursorStack((stack) => stack.slice(0, -1))}
          onNextPage={() => {
            const endCursor = pageInfo?.endCursor;
            if (!endCursor) return;
            setCursorStack((stack) => [...stack, endCursor]);
            setSelectedId("");
          }}
        />
      </AdminSplitLayout>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-reviews" } as const;
