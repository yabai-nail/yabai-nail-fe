"use client";

import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { adminService, useAdminBranch, useAdminBranchReviews, useAdminReviews } from "@/service";
import { ReviewReplyModal } from "./ReviewReplyModal";
import {
  adaptReview,
  filterReviews,
  handlingStatusLabels,
  handlingStatuses,
  paginate,
  ratingStars,
  type ReviewRow,
} from "./data";

const pageSize = 8;

export function AdminReviewsComponent() {
  const { branchId } = useAdminBranch();
  const [scope, setScope] = useState<"branch" | "org">("branch");
  const branchReviews = useAdminBranchReviews(scope === "branch" ? branchId : null);
  const orgReviews = useAdminReviews();
  // Org scope is a read-only overview: replies/handling need a per-review branch id,
  // so those actions stay on the branch scope where the active branch is authoritative.
  const { data, isLoading, error, mutate } = scope === "branch" ? branchReviews : orgReviews;

  const source = useMemo<ReadonlyArray<ReviewRow>>(
    () => (data?.items ? data.items.map(adaptReview) : []),
    [data],
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [replyTo, setReplyTo] = useState<ReviewRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const statuses = useMemo(() => handlingStatuses(source), [source]);
  const filtered = useMemo(() => filterReviews(source, status, query), [source, status, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  const toggleResolved = async (row: ReviewRow) => {
    if (!branchId) return;
    setActionError(null);
    const next = row.handlingStatus === "RESOLVED" ? "PENDING" : "RESOLVED";
    try {
      await adminService.updateBranchReviewHandling(branchId, row.id, { status: next }, row.version);
      void mutate();
    } catch (err) {
      setActionError(err instanceof Error && err.message ? err.message : "Không cập nhật được trạng thái.");
    }
  };

  return (
    <AdminPageLayout>
      <div className="mb-4 flex gap-1 border-b border-admin-border">
        {(["branch", "org"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => { setScope(value); setPage(1); }}
            className={`min-h-11 rounded-t-lg px-4 text-sm font-semibold ${
              scope === value ? "border-b-2 border-admin-accent text-admin-accent" : "text-admin-muted"
            }`}
          >
            {value === "branch" ? "Chi nhánh" : "Toàn hệ thống"}
          </button>
        ))}
      </div>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          Trạng thái xử lý
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            className="min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
          >
            <option value="all">Tất cả</option>
            {statuses.map((code) => (
              <option key={code} value={code}>{handlingStatusLabels[code] ?? code}</option>
            ))}
          </select>
        </label>
        <AdminSearchField
          label="Tìm đánh giá"
          placeholder="Tìm theo khách hàng hoặc nội dung..."
          value={query}
          onChange={(value) => { setQuery(value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">Đang tải đánh giá…</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được đánh giá.</p>
      ) : null}
      {actionError ? <p className="mb-3 text-xs text-admin-danger" role="alert">{actionError}</p> : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Điểm</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="px-4 py-3">Xử lý</th>
                <th className="px-4 py-3">Phản hồi</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-admin-muted">
                    Không có đánh giá phù hợp.
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border align-top last:border-0">
                    <td className="px-4 py-3 font-medium text-admin-ink">{row.customerId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-amber-500" aria-label={`${row.rating} sao`}>
                      {ratingStars(row.rating)}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-admin-ink">{row.content}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                        {handlingStatusLabels[row.handlingStatus] ?? row.handlingStatus}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-admin-muted">{row.replyContent ?? "—"}</td>
                    <td className="px-4 py-3">
                      {scope === "branch" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setReplyTo(row)}>
                            Trả lời
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg"
                            isDisabled={!branchId}
                            onPress={() => void toggleResolved(row)}
                          >
                            {row.handlingStatus === "RESOLVED" ? "Mở lại" : "Đã xử lý"}
                          </Button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-admin-muted">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>Hiển thị {visible.length} trong tổng số {filtered.length} đánh giá</span>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={currentPage === value ? "outline" : "ghost"}
                className={currentPage === value ? "min-w-9 rounded-lg border-admin-accent text-admin-accent" : "min-w-9"}
                onPress={() => setPage(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        </Card.Footer>
      </Card>

      {replyTo && branchId ? (
        <ReviewReplyModal
          branchId={branchId}
          reviewId={replyTo.id}
          customerLabel={replyTo.customerId}
          onClose={() => setReplyTo(null)}
          onReplied={() => void mutate()}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-reviews" } as const;
