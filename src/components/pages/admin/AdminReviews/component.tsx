"use client";

import { useTranslations } from "next-intl";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { notifySuccess } from "@/lib/app-toast";
import { adminService, useAdminBranch, useAdminBranchReviews, useAdminPermission, useAdminReviews, useAuth } from "@/service";
import { ReviewReplyModal } from "./ReviewReplyModal";
import {
  adaptReview,
  filterReviews,
  handlingStatuses,
  paginate,
  ratingStars,
  type ReviewRow,
} from "./data";

const pageSize = 8;

export function AdminReviewsComponent() {
  const t = useTranslations("admin.reviews");
  const tc = useTranslations("admin.common");
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;
  const { branchId } = useAdminBranch();
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const canReply = useAdminPermission("review.reply.branch");
  const canModerate = useAdminPermission("review.moderate.branch");
  const canPublish = useAdminPermission("review.publish.branch");
  const [scope, setScope] = useState<"branch" | "org">("branch");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const reviewQuery = {
    q: query.trim() || undefined,
    status: status === "all" ? undefined : status,
  };
  const branchReviews = useAdminBranchReviews(scope === "branch" ? branchId : null, reviewQuery);
  const orgReviews = useAdminReviews(reviewQuery, isOwner);
  // Org scope is a read-only overview: replies/handling need a per-review branch id,
  // so those actions stay on the branch scope where the active branch is authoritative.
  const { data, isLoading, error, mutate } = scope === "branch" ? branchReviews : orgReviews;

  const source = useMemo<ReadonlyArray<ReviewRow>>(
    // The review response already carries the customer display name. A second
    // branch-wide CRM request was redundant and failed for read-only staff.
    () => (data?.items ? data.items.map((review) => adaptReview(review, undefined, t("unnamedCustomer"))) : []),
    [data, t],
  );

  const [page, setPage] = useState(1);
  const [replyTo, setReplyTo] = useState<ReviewRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [publicationPendingId, setPublicationPendingId] = useState<string | null>(null);

  const statuses = useMemo(
    () => Array.from(new Set(["IN_PROGRESS", "NEW", "RESOLVED", ...handlingStatuses(source)])),
    [source],
  );
  const filtered = useMemo(() => filterReviews(source, status, query), [source, status, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  const toggleResolved = async (row: ReviewRow) => {
    if (!branchId) return;
    setActionError(null);
    // The API accepts NEW, IN_PROGRESS and RESOLVED only; this used to send
    // PENDING, so un-resolving a review always came back 422.
    const next = row.handlingStatus === "RESOLVED" ? "NEW" : "RESOLVED";
    try {
      await adminService.updateBranchReviewHandling(branchId, row.id, { status: next }, row.version);
      notifySuccess(next === "RESOLVED" ? tc("reviewResolved") : tc("reviewReopened"));
      void mutate();
    } catch (err) {
      setActionError(err instanceof Error && err.message ? err.message : t("updateFailed"));
    }
  };

  const updatePublication = async (row: ReviewRow, next: "PUBLISHED" | "HIDDEN") => {
    if (!branchId || publicationPendingId) return;
    setActionError(null);
    setPublicationPendingId(row.id);
    try {
      await adminService.updateBranchReviewPublication(branchId, row.id, { status: next }, row.version, crypto.randomUUID());
      notifySuccess(next === "PUBLISHED" ? t("publicationPublished") : t("publicationHidden"));
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error && err.message ? err.message : t("publicationUpdateFailed"));
    } finally {
      setPublicationPendingId(null);
    }
  };

  return (
    <AdminPageLayout>
      <div className="mb-4 flex gap-1 border-b border-admin-border">
        {(["branch", "org"] as const).filter((value) => value === "branch" || isOwner).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => { setScope(value); setPage(1); }}
            className={`min-h-11 rounded-t-lg px-4 text-sm font-semibold ${
              scope === value ? "border-b-2 border-admin-accent text-admin-accent" : "text-admin-muted"
            }`}
          >
            {value === "branch" ? t("scope.branch") : t("scope.all")}
          </button>
        ))}
      </div>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          {t("handlingLabel")}
          <AdminSelectField
            label={t("filterLabel")}
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={[
              { value: "all", label: t("all") },
              ...statuses.map((code) => ({ value: code, label: statusLabel(code) })),
            ]}
          />
        </div>
        <AdminSearchField
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(value) => { setQuery(value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : null}
      {actionError ? <p className="mb-3 text-xs text-admin-danger" role="alert">{actionError}</p> : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3">{t("columns.customer")}</th>
                <th className="px-4 py-3">{t("columns.rating")}</th>
                <th className="px-4 py-3">{t("columns.content")}</th>
                <th className="px-4 py-3">{t("columns.handling")}</th>
                <th className="px-4 py-3">{t("columns.publication")}</th>
                <th className="px-4 py-3">{t("columns.reply")}</th>
                <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-admin-muted">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border align-top last:border-0">
                    <td className="px-4 py-3 font-medium text-admin-ink">{row.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-amber-500" aria-label={t("ratingLabel", { rating: row.rating })}>
                      {ratingStars(row.rating)}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-admin-ink">{row.content}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                        {statusLabel(row.handlingStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-muted">
                        {t(`publication.${row.publicationStatus}`)}
                      </span>
                      <span className="mt-1 block text-xs text-admin-muted">{t(`source.${row.source}`)}</span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-admin-muted">{row.replyContent ?? "—"}</td>
                    <td className="px-4 py-3">
                      {scope === "branch" ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            isDisabled={!canPublish || publicationPendingId !== null || row.publicationStatus === "PUBLISHED"}
                            onPress={() => void updatePublication(row, "PUBLISHED")}
                          >
                            {t("publish")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg"
                            isDisabled={!canPublish || publicationPendingId !== null || row.publicationStatus === "HIDDEN"}
                            onPress={() => void updatePublication(row, "HIDDEN")}
                          >
                            {t("hide")}
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-lg" isDisabled={!canReply} onPress={() => setReplyTo(row)}>
                            {t("reply")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg"
                            isDisabled={!branchId || !canModerate}
                            onPress={() => void toggleResolved(row)}
                          >
                            {row.handlingStatus === "RESOLVED" ? t("reopen") : t("status.RESOLVED")}
                          </Button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-admin-muted">{t("readOnly")}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>{t("pagination", { shown: visible.length, total: filtered.length })}</span>
          <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </Card.Footer>
      </Card>

      {canReply && replyTo && branchId ? (
        <ReviewReplyModal
          branchId={branchId}
          reviewId={replyTo.id}
          version={replyTo.version}
          customerLabel={replyTo.customerName}
          onClose={() => setReplyTo(null)}
          onReplied={() => void mutate()}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-reviews" } as const;
