"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";
import { adminService } from "@/service";
import {
  formatDateTime,
  formatRating,
  handlingStatusLabel,
  type ReviewRow,
} from "./normalize";

const fieldClassName =
  "block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-sm text-admin-ink outline-none focus:border-admin-accent";

type ReviewDetailPanelProps = {
  readonly review: ReviewRow;
  readonly branchId: string;
  readonly statusOptions: ReadonlyArray<string>;
  readonly onSaved: () => void;
};

/**
 * Mounted with `key={review.id}` by the parent, so every draft below resets
 * when the salon picks a different review instead of leaking one review's
 * reply into the next one.
 */
export function ReviewDetailPanel({
  review,
  branchId,
  statusOptions,
  onSaved,
}: ReviewDetailPanelProps) {
  const [replyDraft, setReplyDraft] = useState("");
  const [replyPending, setReplyPending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [handlingStatus, setHandlingStatus] = useState(
    review.handlingStatus || statusOptions[0] || "",
  );
  const [handlingNote, setHandlingNote] = useState(review.handlingNote);
  const [handlingPending, setHandlingPending] = useState(false);
  const [handlingError, setHandlingError] = useState<string | null>(null);

  async function submitReply() {
    const content = replyDraft.trim();
    if (!content) return;
    setReplyPending(true);
    setReplyError(null);
    try {
      await adminService.replyToBranchReview(branchId, review.id, { content });
      setReplyDraft("");
      onSaved();
    } catch (thrown) {
      setReplyError(
        thrown instanceof Error ? thrown.message : "Không gửi được câu trả lời.",
      );
    } finally {
      setReplyPending(false);
    }
  }

  async function submitHandling() {
    if (!handlingStatus) return;
    setHandlingPending(true);
    setHandlingError(null);
    try {
      const note = handlingNote.trim();
      await adminService.updateBranchReviewHandling(
        branchId,
        review.id,
        { status: handlingStatus, ...(note ? { note } : {}) },
        review.version,
      );
      onSaved();
    } catch (thrown) {
      setHandlingError(
        thrown instanceof Error ? thrown.message : "Không cập nhật được trạng thái xử lý.",
      );
    } finally {
      setHandlingPending(false);
    }
  }

  return (
    <Card className="rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Content className="space-y-4 p-4">
        <header className="space-y-1">
          <p aria-label={`${review.rating} trên 5 sao`} className="text-lg text-admin-accent">
            {formatRating(review.rating)}
          </p>
          <h2 className="text-sm font-bold text-admin-ink">{review.customerLabel}</h2>
          <p className="text-xs text-admin-muted">{formatDateTime(review.createdAt)}</p>
        </header>

        <p className="whitespace-pre-line text-sm text-admin-ink">
          {review.content || "Khách không để lại nội dung."}
        </p>

        <section aria-labelledby="review-reply-heading" className="space-y-2 border-t border-admin-border pt-3">
          <h3 id="review-reply-heading" className="text-sm font-bold text-admin-ink">
            Trả lời khách
          </h3>
          {review.replyContent ? (
            <div className="rounded-lg bg-admin-soft p-2">
              <p className="whitespace-pre-line text-xs text-admin-ink">{review.replyContent}</p>
              <p className="mt-1 text-[0.65rem] text-admin-muted">
                {formatDateTime(review.replyCreatedAt)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-admin-muted">Chưa có câu trả lời nào cho đánh giá này.</p>
          )}
          <textarea
            aria-label="Nội dung trả lời"
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
            rows={3}
            placeholder="Viết câu trả lời gửi tới khách…"
            className={fieldClassName}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              className="rounded-lg"
              onPress={() => void submitReply()}
              isDisabled={replyPending || replyDraft.trim().length === 0}
            >
              {replyPending ? "Đang gửi…" : "Gửi trả lời"}
            </Button>
          </div>
          {replyError ? (
            <p role="alert" className="rounded-lg bg-danger/10 px-2 py-1 text-xs text-danger">
              {replyError}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="review-handling-heading" className="space-y-2 border-t border-admin-border pt-3">
          <h3 id="review-handling-heading" className="text-sm font-bold text-admin-ink">
            Trạng thái xử lý
          </h3>
          <p className="text-xs text-admin-muted">
            Hiện tại: {handlingStatusLabel(review.handlingStatus)}
          </p>
          <label htmlFor="review-handling-status" className="block text-xs font-semibold text-admin-ink">
            <span className="mb-1 block">Chuyển sang</span>
            <select
              id="review-handling-status"
              value={handlingStatus}
              onChange={(event) => setHandlingStatus(event.target.value)}
              className={fieldClassName}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {handlingStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <textarea
            aria-label="Ghi chú xử lý"
            value={handlingNote}
            onChange={(event) => setHandlingNote(event.target.value)}
            rows={2}
            placeholder="Ghi chú nội bộ về cách xử lý…"
            className={fieldClassName}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              className="rounded-lg"
              onPress={() => void submitHandling()}
              isDisabled={handlingPending || handlingStatus.length === 0}
            >
              {handlingPending ? "Đang lưu…" : "Cập nhật xử lý"}
            </Button>
          </div>
          {handlingError ? (
            <p role="alert" className="rounded-lg bg-danger/10 px-2 py-1 text-xs text-danger">
              {handlingError}
            </p>
          ) : null}
        </section>
      </Card.Content>
    </Card>
  );
}
